import { useEffect, useRef, useState } from 'react'
import type { SettingsTab } from '../SettingsModal'
import { fetchAIConfig, streamChat, type AIConfig, type ChatMessage } from '../../lib/api'
import { AssistantMessage } from './AssistantMessage'

// A tool-activity line is a UI-only item; it's not part of the chat history sent to the model.
type ToolItem = { role: 'tool'; note: string }
type UIItem = ChatMessage | ToolItem

/** Build the model-facing history from UI items: drop tool lines, merge consecutive same-role. */
function toHistory(items: UIItem[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const it of items) {
    if (it.role === 'tool' || !it.content.trim()) continue
    const last = out[out.length - 1]
    if (last && last.role === it.role) last.content += '\n' + it.content
    else out.push({ role: it.role, content: it.content })
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

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What can this assistant do?',
    a: 'Two things. It answers questions about Mocktail and about your own mocks (it can see your current endpoints and their responses). And once you add an API key, it can act — create, update, and delete mock endpoints from plain language (e.g. “make a GET /users that returns 3 random users”). The catalog updates live as it works, the same way the MCP server does — just in-app.',
  },
  {
    q: 'How do response delays work?',
    a: 'Each mock can wait 0–30000ms before responding, to simulate latency. Set it with the Delay slider in the editor’s request bar.',
  },
  {
    q: 'How does randomize work?',
    a: 'Open a mock, click a field in the JSON body, then use the Data tab to pick a generator (uuid, email, number…). Values regenerate on every request unless you turn that off (frozen at save).',
  },
  {
    q: 'How do I set a custom status code?',
    a: 'In the editor’s request bar use the Status dropdown — pick a common code or type any value.',
  },
  {
    q: 'How do I run, duplicate, or delete a mock?',
    a: 'Right-click a row for Open / Run / Copy path / Duplicate / Delete. Or use the keyboard: ⌘↵ run · ⌘D duplicate · ⌘E new · ↵ open · ↑↓ navigate.',
  },
  {
    q: 'How do I import mocks?',
    a: 'Settings → Import: paste an exported JSON array (or { "Apis": [...] }) or choose a file. Existing paths are skipped, not overwritten.',
  },
  {
    q: 'How do I export mocks?',
    a: 'Click the download icon next to the ⌘F search in the catalog header — it saves the listed mocks as a timestamped JSON file. If a search or group filter is active, only those are exported (hover the icon for the count). The file re-imports via Settings → Import.',
  },
  {
    q: 'How do I protect my mocks with a key?',
    a: 'Set the MOCKTAIL_API_KEY env var; then requests to /mocktail/* must include an X-API-Key header.',
  },
  {
    q: 'Where is my AI provider key stored?',
    a: 'On your machine, never in the browser. On desktop/CLI it goes in the OS keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service); on headless Linux, a 0600 file in the app-data dir. In containers, set MOCKTAIL_AI_API_KEY instead. All AI calls are made server-side — the dashboard only ever sees a masked hint like sk-…1234. Manage it in Settings → API keys.',
  },
  {
    q: 'What is the Live view?',
    a: 'The ◉ Live button (top bar) streams the real requests hitting your mocks — method, status, latency, and response — newest first.',
  },
]

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** FAQ (works offline) plus agentic chat (answers + creates/edits mocks) once a key is set. */
export function AssistantPanel({
  onOpenSettings,
  onMocksChanged,
}: {
  onOpenSettings: (tab: SettingsTab) => void
  onMocksChanged: () => void
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [items, setItems] = useState<UIItem[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Re-check config each mount (the panel remounts when the right-panel tab is reselected,
  // so a key added in Settings is picked up on return).
  useEffect(() => {
    let alive = true
    fetchAIConfig()
      .then((c) => alive && setConfig(c))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

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
    setInput('')
    setErr(null)
    const history: ChatMessage[] = [...toHistory(items), { role: 'user', content: text }]
    setItems((prev) => [...prev, { role: 'user', content: text }])
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
          <>
            <div className="mb-2 text-[12.5px] text-muted">
              Ask how Mocktail works — pick a question{configured ? ', or chat below' : ''}.
            </div>
            <div className="flex flex-col gap-1">
              {FAQ.map((f, i) => (
                <div key={i} className="rounded-[8px] border border-border">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px]"
                  >
                    <span>{f.q}</span>
                    <span className="shrink-0 text-muted">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-border-subtle px-3 py-2 text-[12.5px] leading-[1.6] text-muted">
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
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
              <span>Enter to send · type /clear to reset · it can create & edit mocks</span>
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
