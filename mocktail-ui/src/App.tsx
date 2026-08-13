import { useEffect, useMemo, useRef, useState } from 'react'
import { mockToDraft, newDraft, type Draft, type Mock } from './lib/mocks'
import { useMocks } from './lib/useMocks'
import { useTheme } from './lib/theme'
import { deleteMock, fetchHealth, saveMock } from './lib/api'
import { downloadMocks } from './lib/export'
import { useResizable } from './hooks/useResizable'
import { useSend } from './hooks/useSend'
import { useCatalogShortcuts } from './hooks/useCatalogShortcuts'
import { useSearchSuggest } from './hooks/useSearchSuggest'
import Editor from './components/Editor'
import { SettingsModal, type SettingsTab } from './components/SettingsModal'
import { LiveView } from './components/LiveView'
import { ContextMenu } from './components/ContextMenu'
import { TopBar } from './components/catalog/TopBar'
import { SearchBar } from './components/catalog/SearchBar'
import { CatalogList } from './components/catalog/CatalogList'
import { ShortcutBar } from './components/catalog/ShortcutBar'
import { RightPanel, type RightTab } from './components/catalog/RightPanel'

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
  const ghost = useSearchSuggest(mocks, query)

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
          <SearchBar
            query={query}
            onChange={setQuery}
            ghost={ghost}
            count={rows.length}
            onExport={() => downloadMocks(rows)}
            exportDisabled={rows.length === 0}
            inputRef={searchRef}
          />
          <CatalogList
            loading={loading}
            error={error}
            rows={rows}
            query={query}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpen={(m) => setEditing(mockToDraft(m))}
            onContext={(e, m) => {
              e.preventDefault()
              setSelectedId(m.id)
              setCtx({ x: e.clientX, y: e.clientY, mock: m })
            }}
          />
          <ShortcutBar
            onNew={() => setEditing(newDraft())}
            onLive={() => setLiveOpen(true)}
            onSettings={() => setSettingsTab('theme')}
          />
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
