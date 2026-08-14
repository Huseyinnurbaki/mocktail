import { useEffect, useRef } from 'react'
import type { SettingsTab } from '../SettingsModal'
import type { Mock } from '../../lib/mocks'
import { useAssistantChat } from '../../hooks/useAssistantChat'
import { AssistantMessage } from './AssistantMessage'

// Example prompts for the empty state — clicking one sends it right away.
// Kept self-contained (create) or /this-based (safe) so they don't assume an endpoint exists.
const EXAMPLES = [
  'Create a GET /users that returns an array of 3 random users',
  'Add a POST /login that returns a fake token',
  'Update /this to return a 404',
  'Add a 400ms delay to /this',
]

/** Empty-state tips plus agentic chat (answers + creates/edits mocks) once a key is set. */
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
  const { config, items, input, setInput, streaming, err, send, clear } = useAssistantChat({
    active,
    configNonce,
    selectedMock,
    onMocksChanged,
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const configured = config?.configured ?? false

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [items, streaming])

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
                  onClick={() => send(ex)}
                  disabled={!configured || streaming}
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
                onClick={() => send()}
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
                <button onClick={clear} className="hover:underline">
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
