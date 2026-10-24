import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { METHODS } from '../lib/mocks'
import { formatBytes } from '../lib/format'
import {
  defaultTab,
  loadTab,
  pathMatches,
  queryPairs,
  requestUrl,
  saveTab,
  statusClass,
  strip,
  toggleIn,
  type DetailTab,
} from '../lib/live'
import { useLiveLogs, useLogEntry } from '../hooks/useLiveLogs'
import { useResizable } from '../hooks/useResizable'
import { ResizeHandle } from './ResizeHandle'
import { MethodBadge } from './MethodBadge'
import { StatusBadge } from './live/StatusBadge'
import { PathFilter } from './live/PathFilter'
import { LiveRow } from './live/LiveRow'
import { HeaderList } from './live/HeaderList'
import { BodyView } from './live/BodyView'

const CAP = 300
const LIST_MIN_PX = 440 // keep in sync with the aside's calc(100vw-440px)
const STATUS_CLASSES = ['2xx', '3xx', '4xx', '5xx']

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

/** Live request stream — list of mock traffic on the left, request/response detail on the right. */
export function LiveView({ port, onClose }: { port: number | null; onClose: () => void }) {
  const { logs, error, paused, setPaused, clear } = useLiveLogs()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null until the user picks a tab; from then on that tab sticks across rows (and reloads).
  const [pickedTab, setPickedTab] = useState<DetailTab | null>(loadTab)
  const [copied, setCopied] = useState(false)
  // The request list keeps at least LIST_MIN_PX, so long paths never get squeezed to nothing.
  const panel = useResizable('mocktail-live-width', 480, 320, 1400, 0.7, LIST_MIN_PX)
  const [methodFilter, setMethodFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [pathFilter, setPathFilter] = useState<Set<string>>(new Set())

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Only mock traffic — exclude the dashboard's own /core/v1 calls.
  const allReq = useMemo(
    () => logs.filter((l) => l.type === 'request' && (l.path ?? '').startsWith('/mocktail')),
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
  const selected = selectedId == null ? null : allReq.find((l) => l.id === selectedId) ?? null
  const detail = useLogEntry(selected ? selected.id : null)
  const tab = pickedTab ?? (selected ? defaultTab(selected) : 'response')

  function pickTab(t: DetailTab) {
    setPickedTab(t)
    saveTab(t)
  }
  const hasFilters = methodFilter.size > 0 || statusFilter.size > 0 || pathFilter.size > 0

  const onSelect = useCallback((id: number) => setSelectedId(id), [])

  // Refs so the key handler stays mounted-once but reads the latest list/selection.
  const shownRef = useRef(shown)
  shownRef.current = shown
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  // ↑/↓ move the selection through the visible list.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return // don't hijack the filter input
      const list = shownRef.current
      if (list.length === 0) return
      e.preventDefault()
      const cur = list.findIndex((l) => l.id === selectedIdRef.current)
      let next: number
      if (cur < 0) next = e.key === 'ArrowDown' ? 0 : list.length - 1
      else next = e.key === 'ArrowDown' ? cur + 1 : cur - 1
      next = Math.max(0, Math.min(list.length - 1, next))
      onSelect(list[next].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSelect])

  // Keep the selected row in view when navigating by keyboard.
  useEffect(() => {
    if (selectedId == null) return
    document.querySelector(`[data-live-row="${selectedId}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  function clearFilters() {
    setMethodFilter(new Set())
    setStatusFilter(new Set())
    setPathFilter(new Set())
  }

  async function onClear() {
    await clear()
    setSelectedId(null)
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
            onClick={() => void onClear()}
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

      <div className="relative flex min-h-0 flex-1">
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
                key={l.id}
                id={l.id}
                method={l.method}
                status={l.status}
                path={strip(l.path)}
                duration={l.duration}
                time={l.timestamp.split(' ')[1] ?? l.timestamp}
                selected={selectedId === l.id}
                onSelect={onSelect}
              />
            ))
          )}
        </div>

        <ResizeHandle
          onPointerDown={panel.startResize}
          nudge={panel.nudge}
          reset={panel.reset}
          className="hidden lg:block"
        />

        {/* detail — a full-screen overlay below lg; a resizable side panel from lg up */}
        <aside
          style={{ '--live-w': `${panel.width}px` } as React.CSSProperties}
          className={`${
            selected ? 'flex' : 'hidden'
          } absolute inset-0 z-30 min-w-0 flex-col bg-bg lg:static lg:z-auto lg:flex lg:w-[clamp(320px,var(--live-w),min(70vw,calc(100vw-440px)))] lg:shrink-0`}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="shrink-0 text-[13px] text-muted hover:text-fg lg:hidden"
                >
                  ←
                </button>
                <MethodBadge method={selected.method} />
                <StatusBadge status={selected.status} />
                {/* Long paths wrap instead of being cut off — the header is the one place the full path shows. */}
                <span className="min-w-0 flex-1 font-mono text-[13px] [overflow-wrap:anywhere]">{strip(selected.path)}</span>
              </div>
              <div className="flex items-center gap-4 border-b border-border px-4 py-2 font-mono text-[11.5px] text-muted">
                <span>⏱ {selected.duration}</span>
                <span>{selected.timestamp}</span>
                {/* The full URL the client hit, query included — waits for the detail (summaries carry no query). */}
                <button
                  disabled={!detail.entry}
                  onClick={() => {
                    if (!detail.entry) return
                    void navigator.clipboard?.writeText(requestUrl(port, selected.path ?? '', detail.entry.requestQuery))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1000)
                  }}
                  className={`ml-auto font-sans text-[11px] transition-colors duration-150 disabled:opacity-40 ${
                    copied ? 'text-accent' : 'text-accent-text hover:text-accent'
                  }`}
                >
                  Copy URL<span className="inline-block w-[11px] text-center">{copied ? '✓' : ''}</span>
                </button>
              </div>
              <div className="flex shrink-0 border-b border-border">
                {(['request', 'response'] as const).map((t) => {
                  const size = (t === 'request' ? selected.requestSize : selected.responseSize) ?? 0
                  return (
                    <button
                      key={t}
                      onClick={() => pickTab(t)}
                      className={`flex-1 border-b-2 py-2 text-[12.5px] ${
                        tab === t ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
                      }`}
                    >
                      {t === 'request' ? 'Request' : 'Response'}
                      {size > 0 && <span className="ml-1.5 font-mono text-[11px] text-muted">{formatBytes(size)}</span>}
                    </button>
                  )
                })}
              </div>
              {detail.entry ? (
                tab === 'request' ? (
                  <>
                    <HeaderList title="Query" entries={queryPairs(detail.entry.requestQuery)} />
                    <HeaderList title="Request headers" entries={Object.entries(detail.entry.requestHeaders ?? {})} />
                    <BodyView
                      key={`${selected.id}-request`}
                      text={detail.entry.requestBody ?? ''}
                      size={selected.requestSize ?? 0}
                      truncated={!!selected.requestTruncated}
                      fullBodyNote="Mocktail received the full body"
                      empty="No request body"
                    />
                  </>
                ) : (
                  <>
                    <HeaderList title="Response headers" entries={Object.entries(detail.entry.responseHeaders ?? {})} />
                    <BodyView
                      key={`${selected.id}-response`}
                      text={detail.entry.responseBody ?? ''}
                      size={selected.responseSize ?? 0}
                      truncated={!!selected.responseTruncated}
                      fullBodyNote="the client got the full body"
                      empty="No response body"
                    />
                  </>
                )
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-muted">
                  {detail.error ??
                    (detail.evicted ? (
                      <span>
                        This request has rolled out of the log. Raise{' '}
                        <code className="font-mono text-fg">MOCKTAIL_LOG_BUFFER_MB</code> to keep more history.
                      </span>
                    ) : (
                      'Loading…'
                    ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-muted">
              Select a request to inspect it
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
