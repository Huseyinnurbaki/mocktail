import { useEffect, useRef, useState } from 'react'
import type { SettingsTab } from '../SettingsModal'
import type { Mock } from '../../lib/mocks'
import { fetchAIConfig, streamChat, type AIConfig, type ChatMessage } from '../../lib/api'
import { AssistantMessage } from './AssistantMessage'

// `/this` in a message expands to the currently-selected endpoint, so "delete /this" or
// "update /this to …" targets it unambiguously (method + path + id for the tools).
const THIS_RE = /(^|\s)\/this\b/gi
function expandThis(text: string, mock: Mock | null): string {
  if (!mock) return text
  return text.replace(THIS_RE, (_m, pre) => `${pre}${mock.method} ${mock.path} (#${mock.id})`)
}

// A chat item shows `content` but, for a user message, may carry `sent` — the resolved text
// actually sent to the model. e.g. "/this" is shown as typed but sends the expanded reference.
type ChatItem = { role: 'user' | 'assistant'; content: string; sent?: string }
// A tool-activity line is a UI-only item; it's not part of the chat history sent to the model.
type ToolItem = { role: 'tool'; note: string }
type UIItem = ChatItem | ToolItem

/** Build the model-facing history from UI items: drop tool lines, merge consecutive same-role. */
function toHistory(items: UIItem[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const it of items) {
    if (it.role === 'tool') continue
    const text = it.sent ?? it.content
    if (!text.trim()) continue
    const last = out[out.length - 1]
    if (last && last.role === it.role) last.content += '\n' + text
    else out.push({ role: it.role, content: text })
  }
  return out
}

/** Append a text delta to the trailing assistant bubble, or start a new one. */
function appendText(items: UIItem[], t: string): UIItem[] {
  const last = items[items.length - 1]
  if (last && last.role === 'assistant') {
    const copy = items.slice()
    copy[copy.length - 1] = { role: 'assistant', content: last.content + t }
    return copy
  }
  return [...items, { role: 'assistant', content: t }]
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// Example prompts for the empty state — clicking one drops it into the composer to edit + send.
// Kept self-contained (create) or /this-based (safe) so they don't assume an endpoint exists.
const EXAMPLES = [
  'Create a GET /users that returns an array of 3 random users',
  'Add a POST /login that returns a fake token',
  'Update /this to return a 404',
  'Add a 400ms delay to /this',
]

/** FAQ (works offline) plus agentic chat (answers + creates/edits mocks) once a key is set. */
export function AssistantPanel({
  onOpenSettings,
  onMocksChanged,
  active,
  selectedMock,
  configNonce,
}: {
  onOpenSettings: (tab: SettingsTab) => void
  onMocksChanged: () => void
  active: boolean
  selectedMock: Mock | null
  configNonce: number
}) {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [items, setItems] = useState<UIItem[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // The panel stays mounted (hidden) across tab switches, so re-check config when it becomes
  // active or when Settings closes (configNonce bumps) — either can change the stored key.
  useEffect(() => {
    if (!active) return
    let alive = true
    fetchAIConfig()
      .then((c) => alive && setConfig(c))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [active, configNonce])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [items, streaming])

  const configured = config?.configured ?? false

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    if (text === '/clear') {
      setItems([])
      setInput('')
      setErr(null)
      return
    }
    if (/(^|\s)\/this\b/i.test(text) && !selectedMock) {
      setErr('Select an endpoint in the list to use /this')
      return
    }
    setInput('')
    setErr(null)
    // Show the message as typed (with /this), but send the resolved reference to the model.
    const sent = expandThis(text, selectedMock)
    const history: ChatMessage[] = [...toHistory(items), { role: 'user', content: sent }]
    setItems((prev) => [...prev, { role: 'user', content: text, sent }])
    setStreaming(true)
    try {
      await streamChat(history, {
        model: config?.model,
        onToken: (t) => setItems((prev) => appendText(prev, t)),
        onTool: (tool) => {
          setItems((prev) => [...prev, { role: 'tool', note: tool.note }])
          // A mutating tool changed the catalog — refresh the list live.
          if (tool.name !== 'list_mocks') onMocksChanged()
        },
      })
    } catch (e) {
      setErr(errText(e))
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col">
            <div className="mb-2 text-[13px] font-medium">Ask about your mocks, or tell me to build them.</div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-muted">Try</div>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  disabled={!configured}
                  className="rounded-[8px] border border-border px-3 py-2 text-left text-[12.5px] leading-[1.4] transition-colors hover:border-accent hover:bg-surface-sunken disabled:cursor-default disabled:opacity-55 disabled:hover:border-border disabled:hover:bg-transparent"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] text-muted">
              <code className="font-mono text-accent-text">/this</code>
              <span>refers to the selected row · it reads your mocks only when you ask</span>
            </div>
            <button
              onClick={() => onOpenSettings('help')}
              className="mt-auto self-start pt-3 text-[11.5px] text-accent-text hover:text-accent"
            >
              How Mocktail works → Settings › Help
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((it, i) =>
              it.role === 'tool' ? (
                <div key={i} className="flex items-center gap-1.5 py-[2px] text-[11.5px] text-muted">
                  <span className="text-accent-text">⚙</span>
                  {it.note}
                </div>
              ) : (
                <div key={i} className={it.role === 'user' ? 'text-right' : ''}>
                  <div
                    className={`inline-block max-w-[88%] rounded-[10px] px-3 py-2 text-left text-[13px] leading-[1.55] ${
                      it.role === 'user'
                        ? 'whitespace-pre-wrap bg-accent text-accent-on'
                        : 'border border-border bg-surface-sunken text-fg'
                    }`}
                  >
                    {it.role === 'assistant' ? <AssistantMessage text={it.content} /> : it.content}
                  </div>
                </div>
              ),
            )}
            {streaming && <div className="px-1 text-[12px] text-muted">…</div>}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        {configured ? (
          <>
            <div className="flex items-center gap-2 rounded-[9px] border border-border px-3 py-2 focus-within:border-accent">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask anything…"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
              />
              <button
                onClick={send}
                disabled={streaming || !input.trim()}
                className="text-[12px] font-semibold text-accent-text disabled:opacity-40"
              >
                {streaming ? '…' : 'Send'}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <code className="font-mono text-accent-text">/this</code>
                <span>selected endpoint</span>
                <span className="text-border">·</span>
                <code className="font-mono text-accent-text">/clear</code>
                <span>reset</span>
              </span>
              {items.length > 0 && (
                <button onClick={() => setItems([])} className="hover:underline">
                  Clear
                </button>
              )}
            </div>
            {err && <div className="mt-1 text-[11.5px] text-error">{err}</div>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-[9px] border border-dashed border-border px-3 py-2 opacity-80">
              <input
                disabled
                placeholder="Ask anything…"
                className="flex-1 cursor-not-allowed bg-transparent text-[13px] outline-none placeholder:text-muted"
              />
              <span className="text-[9px] uppercase tracking-wide text-param">key needed</span>
            </div>
            <button
              onClick={() => onOpenSettings('apikeys')}
              className="mt-1 text-[11px] text-accent-text hover:underline"
            >
              Add an API key to chat freely →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
