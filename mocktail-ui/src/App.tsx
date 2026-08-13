import { useEffect, useMemo, useRef, useState } from 'react'
import { mockToDraft, newDraft, type Draft, type Mock } from './lib/mocks'
import { useMocks } from './lib/useMocks'
import { useTheme } from './lib/theme'
import { deleteMock, fetchHealth, saveMock } from './lib/api'
import { downloadMocks } from './lib/export'
import { useResizable } from './hooks/useResizable'
import { useSend } from './hooks/useSend'
import { useCatalogShortcuts } from './hooks/useCatalogShortcuts'
import Editor from './components/Editor'
import { SettingsModal, type SettingsTab } from './components/SettingsModal'
import { LiveView } from './components/LiveView'
import { ContextMenu } from './components/ContextMenu'
import { TopBar } from './components/catalog/TopBar'
import { CatalogRow } from './components/catalog/CatalogRow'
import { RightPanel, type RightTab } from './components/catalog/RightPanel'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = IS_MAC ? '⌘' : 'Ctrl'

export default function App() {
  const { theme, setTheme, accent, setAccent } = useTheme()
  const { mocks, loading, error, reload } = useMocks()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null)
  // Bumped when Settings closes, so the assistant re-reads AI config (a key may have changed).
  const [aiConfigNonce, setAiConfigNonce] = useState(0)
  const [liveOpen, setLiveOpen] = useState(false)
  const [ctx, setCtx] = useState<{ x: number; y: number; mock: Mock } | null>(null)
  // Persist the right-panel tab so a refresh keeps you where you were.
  const [rightTab, setRightTabState] = useState<RightTab>(
    () => (localStorage.getItem('mocktail-right-tab') === 'assistant' ? 'assistant' : 'preview'),
  )
  const setRightTab = (t: RightTab) => {
    setRightTabState(t)
    localStorage.setItem('mocktail-right-tab', t)
  }
  const [query, setQuery] = useState('')
  const [port, setPort] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Read the backend's actual listen port for the status pill (once, when reachable).
  useEffect(() => {
    if (error || port !== null) return
    fetchHealth()
      .then((h) => h.port && setPort(h.port))
      .catch(() => {})
  }, [error, port])
  const { width: previewWidth, startResize } = useResizable('mocktail-preview-width', 340, 260, 720)
  const { result: sendResult, busy: sendBusy, err: sendErr, run } = useSend(selectedId)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mocks
      .filter(
        (m) =>
          !q ||
          m.path.toLowerCase().includes(q) ||
          m.method.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q),
      )
      .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
  }, [mocks, query])
  const selectedMock = mocks.find((m) => m.id === selectedId) ?? null

  // Every cumulative base-path prefix across all mocks (both "/api/v1" and "api/v1" forms), for
  // inline search completion. e.g. /api/v1/users → /api, /api/v1, /api/v1/users.
  const pathPrefixes = useMemo(() => {
    const set = new Set<string>()
    for (const m of mocks) {
      const clean = m.path.replace(/^\/+/, '')
      if (!clean) continue
      let acc = ''
      for (const seg of clean.split('/')) {
        acc = acc ? acc + '/' + seg : seg
        set.add('/' + acc)
        set.add(acc)
      }
    }
    return Array.from(set)
  }, [mocks])

  // The dimmed tail shown after what the user typed — the shortest matching prefix one segment
  // deeper, so pressing Tab drills the path one level at a time. Empty when nothing to complete.
  const ghost = useMemo(() => {
    if (!query.trim()) return ''
    const lower = query.toLowerCase()
    let best = ''
    for (const p of pathPrefixes) {
      if (p.length > query.length && p.toLowerCase().startsWith(lower) && (!best || p.length < best.length)) {
        best = p
      }
    }
    return best ? best.slice(query.length) : ''
  }, [query, pathPrefixes])

  // Keep the selection within the visible rows — e.g. after switching base-path groups or on
  // first load — so actions (run, ⌘D duplicate) always target a mock in the current view.
  useEffect(() => {
    if (rows.length > 0 && !rows.some((m) => m.id === selectedId)) {
      setSelectedId(rows[0].id)
    }
  }, [rows, selectedId])

  async function duplicate(mock: Mock) {
    const existing = new Set(mocks.map((m) => m.path))
    let path = `${mock.path}-copy`
    let n = 2
    while (existing.has(path)) path = `${mock.path}-copy-${n++}`
    try {
      await saveMock({
        id: null,
        method: mock.method,
        path,
        status: mock.status,
        delayMs: mock.delayMs,
        body: mock.body,
        randomize: mock.randomize,
        headers: mock.headers,
      })
      await reload()
    } catch {
      /* collision or network error — ignore for now */
    }
  }

  async function remove(mock: Mock) {
    try {
      await deleteMock(mock.id)
      if (selectedId === mock.id) setSelectedId(null)
      await reload()
    } catch {
      /* ignore for now */
    }
  }

  function moveSelection(delta: number) {
    if (rows.length === 0) return
    const idx = rows.findIndex((m) => m.id === selectedId)
    const next = idx < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, idx + delta))
    setSelectedId(rows[next].id)
  }

  useCatalogShortcuts({
    enabled: !editing && !settingsTab && !liveOpen,
    selectedMock,
    onFocusSearch: () => searchRef.current?.focus(),
    onOpenSettings: () => setSettingsTab('theme'),
    onOpenLive: () => setLiveOpen(true),
    onNew: () => setEditing(newDraft()),
    onOpen: (m) => setEditing(mockToDraft(m)),
    onRun: (m) => void run(m),
    onDuplicate: (m) => void duplicate(m),
    onMove: moveSelection,
  })

  return (
    <div className="relative flex h-full flex-col bg-bg text-fg">
      <TopBar
        connected={!error}
        port={port ?? undefined}
        onOpenLive={() => setLiveOpen(true)}
        onNew={() => setEditing(newDraft())}
      />
      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-[18px] py-3">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="shrink-0 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            {/* Search with inline path completion: a dimmed ghost tail suggests the next base-path
                segment; Tab accepts it. An invisible copy of the typed text reserves width so the
                ghost lines up right after the caret. */}
            <div className="relative flex-1">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-[13px]"
              >
                <span className="invisible">{query}</span>
                <span className="text-muted/50">{ghost}</span>
              </div>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && ghost) {
                    e.preventDefault()
                    setQuery(query + ghost)
                  } else if (e.key === 'Escape') {
                    setQuery('')
                    e.currentTarget.blur()
                  }
                }}
                placeholder="Search endpoints — type a path, ⇥ to complete"
                className="relative w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
              />
            </div>
            <span className="whitespace-nowrap text-[12px] text-muted">{rows.length} endpoints</span>
            <kbd className="shrink-0 rounded-[4px] border border-border px-[4px] py-[1px] font-mono text-[10px] text-muted">
              {MOD}F
            </kbd>
            <button
              onClick={() => downloadMocks(rows)}
              disabled={rows.length === 0}
              title={`Export ${rows.length} mock${rows.length === 1 ? '' : 's'}${query.trim() ? ' matching search' : ''} as JSON`}
              aria-label="Export mocks"
              className="shrink-0 text-muted hover:text-fg disabled:opacity-40"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="p-6 text-[13px] text-muted">Loading mocks…</div>
            ) : error ? (
              <div className="m-4 rounded-[9px] border border-error/40 bg-del-bg px-4 py-3 text-[13px] text-del-fg">
                Couldn’t reach the backend at <span className="font-mono">/core/v1/apis</span> — {error}.
                <br />
                Is it running? <span className="font-mono">cd mocktail-api &amp;&amp; make dev-api</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-[13px] text-muted">
                {query.trim() ? (
                  <>No mocks match “{query.trim()}”.</>
                ) : (
                  <>
                    No mocks yet. Create one with <span className="font-mono">+ New mock</span>.
                  </>
                )}
              </div>
            ) : (
              rows.map((m) => (
                <CatalogRow
                  key={m.id}
                  mock={m}
                  selected={m.id === selectedId}
                  onSelect={() => setSelectedId(m.id)}
                  onOpen={() => setEditing(mockToDraft(m))}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setSelectedId(m.id)
                    setCtx({ x: e.clientX, y: e.clientY, mock: m })
                  }}
                />
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-border px-[18px] py-2 font-mono text-[11.5px] text-muted">
            ↑↓ navigate · ↵ open · {MOD}↵ run · {MOD}C copy · {MOD}D duplicate ·{' '}
            <button
              onClick={() => setEditing(newDraft())}
              className="text-accent-text transition-colors hover:text-accent"
            >
              {MOD}E new
            </button>{' '}
            ·{' '}
            <button
              onClick={() => setLiveOpen(true)}
              className="text-accent-text transition-colors hover:text-accent"
            >
              {MOD}L live
            </button>{' '}
            ·{' '}
            <button
              onClick={() => setSettingsTab('theme')}
              className="text-accent-text transition-colors hover:text-accent"
            >
              {MOD}O settings
            </button>
          </div>
        </main>

        <div
          onMouseDown={startResize}
          title="Drag to resize"
          className="hidden w-[5px] shrink-0 cursor-col-resize hover:bg-accent/50 md:block"
        />
        <RightPanel
          mock={selectedMock}
          onEdit={(m) => setEditing(mockToDraft(m))}
          onSend={(m) => void run(m)}
          result={sendResult}
          busy={sendBusy}
          err={sendErr}
          width={previewWidth}
          port={port ?? undefined}
          tab={rightTab}
          setTab={setRightTab}
          onOpenSettings={setSettingsTab}
          onMocksChanged={reload}
          configNonce={aiConfigNonce}
        />
      </div>

      {editing && (
        <Editor initial={editing} onClose={() => setEditing(null)} onReload={reload} />
      )}

      {settingsTab && (
        <SettingsModal
          initialTab={settingsTab}
          theme={theme}
          setTheme={setTheme}
          accent={accent}
          setAccent={setAccent}
          onImported={reload}
          onClose={() => {
            setSettingsTab(null)
            setAiConfigNonce((n) => n + 1)
          }}
        />
      )}

      {liveOpen && <LiveView onClose={() => setLiveOpen(false)} />}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          items={[
            { label: 'Open', onClick: () => setEditing(mockToDraft(ctx.mock)) },
            { label: 'Run', onClick: () => void run(ctx.mock) },
            { label: 'Copy path', onClick: () => void navigator.clipboard?.writeText(ctx.mock.path) },
            { label: 'Duplicate', onClick: () => void duplicate(ctx.mock) },
            {
              label: 'Delete',
              confirm: true,
              confirmLabel: 'Click again to delete',
              danger: true,
              onClick: () => void remove(ctx.mock),
            },
          ]}
        />
      )}
    </div>
  )
}
