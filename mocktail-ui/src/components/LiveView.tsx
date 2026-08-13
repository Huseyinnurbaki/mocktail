import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { clearLogs, fetchLogs, type LogEntry } from '../lib/api'
import { METHODS } from '../lib/mocks'
import { beautify, statusBadgeClass } from '../lib/format'
import { CodeEditor } from './CodeEditor'
import { MethodBadge } from './MethodBadge'

const CAP = 300
const STATUS_CLASSES = ['2xx', '3xx', '4xx', '5xx']

function statusClass(status?: number): string {
  if (!status || status < 100) return ''
  return `${Math.floor(status / 100)}xx`
}

const strip = (p?: string) => (p ?? '').replace(/^\/mocktail/, '') || '/'

/** A request path matches the selection if it equals an exact entry or falls under a `/prefix/*` entry. */
function pathMatches(path: string, selected: Set<string>): boolean {
  if (selected.size === 0) return true
  for (const sel of selected) {
    if (sel.endsWith('/*')) {
      if (path.startsWith(sel.slice(0, -1))) return true // '/api/v1/*' → prefix '/api/v1/'
    } else if (path === sel) {
      return true
    }
  }
  return false
}

function toggleIn(set: Set<string>, key: string): Set<string> {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-[24px] rounded-[6px] border px-[7px] font-mono text-[11px] transition ${
        active
          ? 'border-accent bg-accent-tint text-accent-text'
          : 'border-border text-muted hover:bg-surface-sunken'
      }`}
    >
      {children}
    </button>
  )
}

/** Searchable multi-select dropdown of the paths currently seen in traffic. */
function PathFilter({
  wild,
  exact,
  selected,
  onChange,
}: {
  wild: string[]
  exact: string[]
  selected: Set<string>
  onChange: (s: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [query, setQuery] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const MENU_W = 300

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - MENU_W - 8) })
    setQuery('')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function close() {
      setOpen(false)
    }
    function onScroll(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return // scrolling inside the menu — keep open
      close()
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const fWild = q ? wild.filter((p) => p.toLowerCase().includes(q)) : wild
  const fExact = q ? exact.filter((p) => p.toLowerCase().includes(q)) : exact
  const label = selected.size === 0 ? 'All paths' : selected.size === 1 ? [...selected][0] : `${selected.size} paths`

  const opt = (p: string) => (
    <button
      key={p}
      onClick={() => onChange(toggleIn(selected, p))}
      className={`flex w-full items-center gap-2 rounded-[5px] px-2 py-1 text-left font-mono text-[12px] hover:bg-surface-sunken ${
        selected.has(p) ? 'text-accent-text' : ''
      }`}
    >
      <span className="flex-1 truncate">{p}</span>
      {selected.has(p) && <span>✓</span>}
    </button>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex h-[26px] min-w-[140px] max-w-[260px] items-center gap-1 rounded-[7px] border px-2 text-[12px] ${
          selected.size
            ? 'border-accent bg-accent-tint text-accent-text'
            : 'border-border text-muted hover:bg-surface-sunken'
        }`}
      >
        <span className="flex-1 truncate text-left font-mono">{label}</span>
        <span className="text-[9px] opacity-70">▼</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
            className="fixed z-50 flex max-h-[320px] flex-col overflow-hidden rounded-[9px] border border-border bg-surface shadow-lg"
          >
            <div className="border-b border-border-subtle p-1">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation()
                    setOpen(false)
                  }
                }}
                placeholder="Search paths…"
                className="w-full rounded-[5px] bg-surface-sunken px-2 py-1 text-[12px] outline-none placeholder:text-muted"
              />
            </div>
            <div className="overflow-auto p-1">
              {selected.size > 0 && (
                <button
                  onClick={() => onChange(new Set())}
                  className="mb-1 block w-full rounded-[5px] px-2 py-1 text-left text-[12px] text-accent-text hover:bg-surface-sunken"
                >
                  Clear selection
                </button>
              )}
              {fWild.length === 0 && fExact.length === 0 ? (
                <div className="px-2 py-2 text-[12px] text-muted">No paths</div>
              ) : (
                <>
                  {fWild.length > 0 && (
                    <>
                      <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                        Prefixes
                      </div>
                      {fWild.map(opt)}
                    </>
                  )}
                  {fExact.length > 0 && (
                    <>
                      <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                        Paths
                      </div>
                      {fExact.map(opt)}
                    </>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

/** One traffic row — memoized on primitive props so unchanged rows skip re-render across polls. */
const LiveRow = memo(function LiveRow({
  method,
  status,
  path,
  duration,
  time,
  selected,
  index,
  onSelect,
}: {
  method?: string
  status?: number
  path: string
  duration?: string
  time: string
  selected: boolean
  index: number
  onSelect: (i: number) => void
}) {
  return (
    <button
      onClick={() => onSelect(index)}
      style={selected ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-[18px] py-[9px] text-left focus:outline-none ${
        selected ? 'bg-accent-tint' : 'hover:bg-surface-sunken'
      }`}
    >
      <MethodBadge method={method} />
      <StatusBadge status={status} />
      <span className="flex-1 truncate font-mono text-[13px]">{path}</span>
      <span className="shrink-0 font-mono text-[11.5px] text-muted">{duration}</span>
      <span className="w-[64px] shrink-0 text-right font-mono text-[11.5px] text-muted">{time}</span>
    </button>
  )
})

/** Live request stream — list of mock traffic on the left, response detail on the right. */
export function LiveView({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedI, setSelectedI] = useState<number | null>(null)
  const [methodFilter, setMethodFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [pathFilter, setPathFilter] = useState<Set<string>>(new Set())
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
  const allReq = useMemo(
    () =>
      logs
        .map((l, i) => ({ ...l, i }))
        .filter((l) => l.type === 'request' && (l.path ?? '').startsWith('/mocktail')),
    [logs],
  )

  // Path-filter dropdown options: exact paths seen + `/prefix/*` wildcards that group ≥2 of them.
  const pathOptions = useMemo(() => {
    const exactSet = new Set<string>()
    for (const l of allReq) exactSet.add(strip(l.path))
    const exact = [...exactSet].sort()
    const prefixCount = new Map<string, number>()
    for (const p of exact) {
      const segs = p.split('/').filter(Boolean)
      let acc = ''
      for (let i = 0; i < segs.length - 1; i++) {
        acc += '/' + segs[i]
        const w = acc + '/*'
        prefixCount.set(w, (prefixCount.get(w) ?? 0) + 1)
      }
    }
    const wild = [...prefixCount.entries()]
      .filter(([, c]) => c >= 2)
      .map(([w]) => w)
      .sort()
    return { wild, exact }
  }, [allReq])

  // Apply filters (AND across dimensions, OR within), newest-first.
  const requests = useMemo(() => {
    const out = allReq.filter(
      (l) =>
        (methodFilter.size === 0 || methodFilter.has((l.method ?? '').toUpperCase())) &&
        (statusFilter.size === 0 || statusFilter.has(statusClass(l.status))) &&
        pathMatches(strip(l.path), pathFilter),
    )
    out.reverse()
    return out
  }, [allReq, methodFilter, statusFilter, pathFilter])

  const shown = requests.length > CAP ? requests.slice(0, CAP) : requests
  const selected = selectedI == null ? null : allReq.find((l) => l.i === selectedI) ?? null
  const hasFilters = methodFilter.size > 0 || statusFilter.size > 0 || pathFilter.size > 0

  const onSelect = useCallback((i: number) => setSelectedI(i), [])

  function clearFilters() {
    setMethodFilter(new Set())
    setStatusFilter(new Set())
    setPathFilter(new Set())
  }

  async function clear() {
    await clearLogs()
    setLogs([])
    setSelectedI(null)
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
          {paused ? 'paused' : 'live'} · {requests.length > CAP ? `${CAP}+` : requests.length}
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

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <div className="flex gap-1">
          {METHODS.map((m) => (
            <Chip key={m} active={methodFilter.has(m)} onClick={() => setMethodFilter((s) => toggleIn(s, m))}>
              {m}
            </Chip>
          ))}
        </div>
        <span className="h-4 w-px bg-border" />
        <div className="flex gap-1">
          {STATUS_CLASSES.map((s) => (
            <Chip key={s} active={statusFilter.has(s)} onClick={() => setStatusFilter((cur) => toggleIn(cur, s))}>
              {s}
            </Chip>
          ))}
        </div>
        <PathFilter
          wild={pathOptions.wild}
          exact={pathOptions.exact}
          selected={pathFilter}
          onChange={setPathFilter}
        />
        {hasFilters && (
          <button onClick={clearFilters} className="text-[12px] text-muted hover:text-fg">
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="border-b border-border bg-del-bg px-4 py-2 text-[12.5px] text-del-fg">{error}</div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* list */}
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          {shown.length === 0 ? (
            hasFilters && allReq.length > 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="text-[14px] font-medium">No requests match your filters</div>
                <button onClick={clearFilters} className="text-[12.5px] text-accent-text hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="text-[30px] text-accent opacity-50">◉</div>
                <div className="text-[14px] font-medium">Waiting for requests…</div>
                <div className="max-w-[320px] text-[12.5px] text-muted">
                  Hit any mock endpoint and it’ll stream in here — method, status, latency, and response.
                </div>
              </div>
            )
          ) : (
            shown.map((l) => (
              <LiveRow
                key={l.i}
                index={l.i}
                method={l.method}
                status={l.status}
                path={(l.path ?? '').replace(/^\/mocktail/, '') || '/'}
                duration={l.duration}
                time={l.timestamp.split(' ')[1] ?? l.timestamp}
                selected={selectedI === l.i}
                onSelect={onSelect}
              />
            ))
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
              {selected.responseHeaders && Object.keys(selected.responseHeaders).length > 0 && (
                <div className="shrink-0 border-b border-border px-4 py-2">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.06em] text-muted">Response headers</div>
                  <div className="flex max-h-[120px] flex-col gap-[2px] overflow-auto font-mono text-[11px]">
                    {Object.entries(selected.responseHeaders).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="shrink-0 text-muted">{k}:</span>
                        <span className="min-w-0 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
