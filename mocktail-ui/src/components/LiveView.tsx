import { useEffect, useRef, useState } from 'react'
import { clearLogs, fetchLogs, type LogEntry } from '../lib/api'
import { beautify, statusBadgeClass } from '../lib/format'
import { CodeEditor } from './CodeEditor'
import { MethodBadge } from './MethodBadge'

function keyOf(l: LogEntry): string {
  return `${l.timestamp}|${l.method}|${l.path}|${l.status}|${l.duration}`
}

function StatusBadge({ status }: { status?: number }) {
  return (
    <span
      className={`inline-flex h-[18px] min-w-[36px] shrink-0 items-center justify-center rounded-[5px] px-1 font-mono text-[11px] font-semibold ${statusBadgeClass(
        status ?? 0,
      )}`}
    >
      {status}
    </span>
  )
}

/** Live request stream — list of mock traffic on the left, response detail on the right. */
export function LiveView({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<LogEntry | null>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    let alive = true
    async function poll() {
      if (pausedRef.current) return
      try {
        const l = await fetchLogs()
        if (alive) {
          setLogs(l)
          setError(null)
        }
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    }
    void poll()
    const id = setInterval(poll, 1500)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Only mock traffic — exclude the dashboard's own /core/v1 calls.
  const requests = logs
    .filter((l) => l.type === 'request' && (l.path ?? '').startsWith('/mocktail'))
    .reverse()

  const selectedKey = selected ? keyOf(selected) : null

  async function clear() {
    await clearLogs()
    setLogs([])
    setSelected(null)
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg text-fg">
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-4">
        <button onClick={onClose} className="text-[13px] text-muted hover:text-fg">
          ← Catalog
        </button>
        <span className="text-[15px] font-semibold">Live traffic</span>
        <span className="inline-flex items-center gap-[6px] rounded-full bg-accent-tint px-[9px] py-[4px] font-mono text-[11px] text-accent-text">
          <span className={`h-[7px] w-[7px] rounded-full ${paused ? 'bg-warning' : 'animate-pulse bg-accent'}`} />
          {paused ? 'paused' : 'live'} · {requests.length}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="h-[30px] rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => void clear()}
            className="h-[30px] rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
          >
            Clear
          </button>
        </div>
      </header>

      {error && (
        <div className="border-b border-border bg-del-bg px-4 py-2 text-[12.5px] text-del-fg">{error}</div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* list */}
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          {requests.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="text-[30px] text-accent opacity-50">◉</div>
              <div className="text-[14px] font-medium">Waiting for requests…</div>
              <div className="max-w-[320px] text-[12.5px] text-muted">
                Hit any mock endpoint and it’ll stream in here — method, status, latency, and response.
              </div>
            </div>
          ) : (
            requests.map((l, i) => {
              const path = (l.path ?? '').replace(/^\/mocktail/, '') || '/'
              const time = l.timestamp.split(' ')[1] ?? l.timestamp
              const isSel = selectedKey === keyOf(l)
              return (
                <button
                  key={i}
                  onClick={() => setSelected(l)}
                  style={isSel ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
                  className={`flex w-full items-center gap-3 border-b border-border-subtle px-[18px] py-[9px] text-left ${
                    isSel ? 'bg-accent-tint' : 'hover:bg-surface-sunken'
                  }`}
                >
                  <MethodBadge method={l.method} />
                  <StatusBadge status={l.status} />
                  <span className="flex-1 truncate font-mono text-[13px]">{path}</span>
                  <span className="shrink-0 font-mono text-[11.5px] text-muted">{l.duration}</span>
                  <span className="w-[64px] shrink-0 text-right font-mono text-[11.5px] text-muted">{time}</span>
                </button>
              )
            })
          )}
        </div>

        {/* detail */}
        <aside className="hidden w-[42%] min-w-[320px] max-w-[560px] shrink-0 flex-col border-l border-border lg:flex">
          {selected ? (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <MethodBadge method={selected.method} />
                <StatusBadge status={selected.status} />
                <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                  {(selected.path ?? '').replace(/^\/mocktail/, '') || '/'}
                </span>
              </div>
              <div className="flex gap-4 border-b border-border px-4 py-2 font-mono text-[11.5px] text-muted">
                <span>⏱ {selected.duration}</span>
                <span>{selected.timestamp}</span>
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditor value={beautify(selected.responseBody ?? '')} onChange={() => {}} readOnly />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-muted">
              Select a request to inspect its response
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
