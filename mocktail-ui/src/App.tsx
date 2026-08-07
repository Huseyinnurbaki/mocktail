import { useEffect, useMemo, useState } from 'react'
import { buildTree, matchesGroup, fmtHits, mockToDraft, newDraft, type Draft, type Method, type Mock } from './lib/mocks'
import { useMocks } from './lib/useMocks'
import { useTheme } from './lib/theme'
import { sendMock, type TestResult } from './lib/api'
import Editor from './components/Editor'
import { ResponseView } from './components/ResponseView'
import { SettingsModal, type SettingsTab } from './components/SettingsModal'

const METHOD_BADGE: Record<Method, string> = {
  GET: 'bg-get-bg text-get-fg',
  POST: 'bg-post-bg text-post-fg',
  PUT: 'bg-put-bg text-put-fg',
  PATCH: 'bg-put-bg text-put-fg',
  DELETE: 'bg-del-bg text-del-fg',
}

function MethodBadge({ method }: { method: Method }) {
  return (
    <span
      className={`inline-flex h-[18px] w-[58px] shrink-0 items-center justify-center rounded-[5px] font-mono text-[11px] font-semibold ${METHOD_BADGE[method]}`}
    >
      {method}
    </span>
  )
}

/** Renders a path, tinting `:param` segments. */
function PathText({ path, className = '' }: { path: string; className?: string }) {
  const parts = path.split('/')
  return (
    <span className={`font-mono ${className}`}>
      {parts.map((seg, i) => (
        <span key={i} className={seg.startsWith(':') ? 'text-param' : undefined}>
          {i === 0 ? '' : '/'}
          {seg}
        </span>
      ))}
    </span>
  )
}

function TopBar({
  connected,
  onNew,
  onOpenSettings,
}: {
  connected: boolean
  onNew: () => void
  onOpenSettings: (tab: SettingsTab) => void
}) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-accent text-[12px] font-bold text-accent-on">
          M
        </div>
        <span className="text-[15px] font-semibold">Mocktail</span>
      </div>

      {/* server status pill — reflects backend connectivity */}
      <span
        className={`ml-1 inline-flex items-center gap-[6px] rounded-full py-[4px] pl-[7px] pr-[9px] font-mono text-[11.5px] ${
          connected ? 'bg-accent-tint text-accent-text' : 'bg-del-bg text-del-fg'
        }`}
      >
        <span className={`h-[6px] w-[6px] rounded-full ${connected ? 'bg-accent' : 'bg-error'}`} />
        {connected ? 'running · localhost:4000' : 'stopped'}
      </span>

      <div className="mx-auto flex h-[32px] w-full max-w-[420px] items-center gap-2 rounded-[8px] border border-border bg-surface px-3">
        <span className="text-muted">⌕</span>
        <input
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
          placeholder="Search paths, methods, response bodies"
        />
        <kbd className="rounded-[4px] border border-border px-[5px] py-[1px] font-mono text-[10.5px] text-muted">
          ⌘K
        </kbd>
      </div>

      <button
        onClick={() => onOpenSettings('theme')}
        className="flex h-[30px] items-center gap-1.5 rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
      >
        <span className="text-[13px]">⚙</span> Settings
      </button>
      <button
        onClick={onNew}
        className="h-[30px] rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-accent-on"
      >
        + New mock
      </button>
    </header>
  )
}

function LeftTree({
  mocks,
  selectedKey,
  onSelect,
  collapsed,
  onToggle,
}: {
  mocks: Mock[]
  selectedKey: string | null
  onSelect: (k: string | null) => void
  collapsed: Set<string>
  onToggle: (k: string) => void
}) {
  const tree = useMemo(() => buildTree(mocks), [mocks])
  const row = 'flex w-full items-center justify-between rounded-[7px] px-2 py-[6px]'
  const sel = (active: boolean) => (active ? 'bg-accent-tint text-accent-text' : 'hover:bg-surface')

  return (
    <nav className="hidden w-[236px] shrink-0 flex-col gap-1 overflow-auto border-r border-border bg-surface-sunken p-2 lg:flex">
      <button onClick={() => onSelect(null)} className={`${row} text-[13px] ${sel(selectedKey === null)}`}>
        <span>All mocks</span>
        <span className="text-muted">{mocks.length}</span>
      </button>

      <div className="mt-2 px-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">
        Grouped by base path
      </div>

      {tree.map((base) => {
        const open = !collapsed.has(base.key)
        const hasChildren = base.resources.length > 0
        return (
          <div key={base.key}>
            <button
              onClick={() => {
                onSelect(base.key)
                if (hasChildren) onToggle(base.key)
              }}
              className={`${row} font-mono text-[12.5px] ${sel(selectedKey === base.key)}`}
            >
              <span>
                <span className="text-muted">{hasChildren ? (open ? '▾ ' : '▸ ') : '  '}</span>
                {base.label}
              </span>
              <span className="text-muted">{base.count}</span>
            </button>

            {open && hasChildren && (
              <div className="ml-[15px] mt-1 flex flex-col gap-1 border-l border-border-subtle pl-2">
                {base.resources.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => onSelect(r.key)}
                    className={`${row} font-mono text-[12px] ${sel(selectedKey === r.key)}`}
                  >
                    <span className="truncate">{r.label}</span>
                    <span className="text-muted">{r.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function CatalogRow({
  mock,
  selected,
  onSelect,
  onOpen,
}: {
  mock: Mock
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  return (
    <button
      onClick={onSelect}
      onDoubleClick={onOpen}
      style={selected ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-[18px] py-[13px] text-left ${
        selected ? 'bg-accent-tint' : 'hover:bg-surface-sunken'
      }`}
    >
      <MethodBadge method={mock.method} />
      <PathText path={mock.path} className="flex-1 text-[13.5px]" />
      <span className={`font-mono text-[12px] ${mock.status < 300 ? 'text-success' : 'text-error'}`}>
        {mock.status}
      </span>
      <span
        className={`w-[64px] text-right font-mono text-[12px] ${
          mock.delayMs > 0 ? 'text-warning' : 'text-muted'
        }`}
      >
        {mock.delayMs}ms
      </span>
      <span className="w-[76px] text-right text-[12px] text-muted">{fmtHits(mock.hits)} hits</span>
    </button>
  )
}

function PreviewPane({ mock, onEdit }: { mock: Mock | null; onEdit: (m: Mock) => void }) {
  const [result, setResult] = useState<TestResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Clear any prior response when the selected mock changes.
  useEffect(() => {
    setResult(null)
    setErr(null)
  }, [mock?.id])

  if (!mock) {
    return (
      <aside className="hidden w-[330px] shrink-0 items-center justify-center border-l border-border p-6 text-[13px] text-muted xl:flex">
        Select a mock to preview
      </aside>
    )
  }

  async function send(m: Mock) {
    setBusy(true)
    setErr(null)
    try {
      setResult(await sendMock(m.method, m.path))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="hidden w-[330px] shrink-0 flex-col gap-4 overflow-auto border-l border-border p-4 xl:flex">
      <div className="flex items-center gap-2">
        <MethodBadge method={mock.method} />
        <PathText path={mock.path} className="text-[13px]" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => void send(mock)}
          disabled={busy}
          className="h-[32px] flex-1 rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
        >
          {busy ? 'Sending…' : '▶ Send request'}
        </button>
        <button
          onClick={() => onEdit(mock)}
          className="h-[32px] rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
        >
          Edit
        </button>
      </div>
      <dl className="rounded-[11px] border border-border text-[12.5px]">
        {[
          ['Status', String(mock.status)],
          ['Delay', `${mock.delayMs} ms`],
          ['Hits', fmtHits(mock.hits)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border-subtle px-3 py-2 last:border-0">
            <dt className="text-muted">{k}</dt>
            <dd className="font-mono">{v}</dd>
          </div>
        ))}
      </dl>
      {err && <div className="text-[12.5px] text-error">{err}</div>}
      {result && (
        <div>
          <div className="mb-1 font-mono text-[12px]">
            <span className={result.status < 300 ? 'text-success' : 'text-error'}>{result.status}</span>{' '}
            · {result.ms}ms
          </div>
          <ResponseView body={result.body} />
        </div>
      )}
    </aside>
  )
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const { mocks, loading, error, reload } = useMocks()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Draft | null>(null)
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null)

  const toggleGroup = (k: string) =>
    setCollapsed((s) => {
      const n = new Set(s)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  // Select the first mock once data arrives.
  useEffect(() => {
    if (selectedId === null && mocks.length > 0) setSelectedId(mocks[0].id)
  }, [mocks, selectedId])

  const rows = useMemo(
    () => mocks.filter((m) => matchesGroup(m, selectedGroup)),
    [mocks, selectedGroup],
  )
  const selectedMock = mocks.find((m) => m.id === selectedId) ?? null

  return (
    <div className="relative flex h-full flex-col bg-bg text-fg">
      <TopBar
        connected={!error}
        onNew={() => setEditing(newDraft())}
        onOpenSettings={setSettingsTab}
      />
      <div className="flex min-h-0 flex-1">
        <LeftTree
          mocks={mocks}
          selectedKey={selectedGroup}
          onSelect={setSelectedGroup}
          collapsed={collapsed}
          onToggle={toggleGroup}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-[18px] py-3">
            <span className="font-mono text-[14px]">{selectedGroup ?? 'All mocks'}</span>
            <span className="text-[12px] text-muted">{rows.length} endpoints</span>
            <div className="ml-auto flex gap-2">
              <button className="h-[26px] rounded-[6px] border border-border px-2 text-[12px] hover:bg-surface-sunken">
                Method ▾
              </button>
              <button className="h-[26px] rounded-[6px] border border-border px-2 text-[12px] hover:bg-surface-sunken">
                Status ▾
              </button>
            </div>
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
                No mocks yet. Create one with <span className="font-mono">+ New mock</span>.
              </div>
            ) : (
              rows.map((m) => (
                <CatalogRow
                  key={m.id}
                  mock={m}
                  selected={m.id === selectedId}
                  onSelect={() => setSelectedId(m.id)}
                  onOpen={() => setEditing(mockToDraft(m))}
                />
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-border px-[18px] py-2 font-mono text-[11.5px] text-muted">
            ↑↓ navigate · ↵ open · ⌘⏎ run · ⌘D duplicate
          </div>
        </main>

        <PreviewPane mock={selectedMock} onEdit={(m) => setEditing(mockToDraft(m))} />
      </div>

      {editing && (
        <Editor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}

      {settingsTab && (
        <SettingsModal
          initialTab={settingsTab}
          theme={theme}
          setTheme={setTheme}
          onImported={reload}
          onClose={() => setSettingsTab(null)}
        />
      )}
    </div>
  )
}
