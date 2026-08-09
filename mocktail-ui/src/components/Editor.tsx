import { useEffect, useMemo, useState } from 'react'
import { COMMON_STATUS, METHODS, type Draft, type Method, type RandomizeConfig } from '../lib/mocks'
import { saveMock } from '../lib/api'
import { METHOD_BADGE } from '../lib/methods'
import { validateJson } from '../lib/json'
import { CodeEditor } from './CodeEditor'
import { DataTab } from './editor/DataTab'
import { HeadersTab } from './editor/HeadersTab'
import { SnippetsTab } from './editor/SnippetsTab'
import { TestTab } from './editor/TestTab'

type Tab = 'data' | 'headers' | 'snippets' | 'test'
const TABS: Tab[] = ['data', 'headers', 'snippets', 'test']


export default function Editor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Draft
  onClose: () => void
  onSaved: () => void
}) {
  const [method, setMethod] = useState<Method>(initial.method)
  const [path, setPath] = useState(initial.path)
  const [status, setStatus] = useState(initial.status)
  const [delayMs, setDelayMs] = useState(initial.delayMs)
  const [body, setBody] = useState(initial.body)
  const [randomize, setRandomize] = useState<RandomizeConfig>(initial.randomize)
  const [tab, setTab] = useState<Tab>('data')
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const jsonError = useMemo(() => validateJson(body), [body])

  // Which field keys to highlight in the editor, with their generator label.
  const highlights = useMemo(() => {
    const seen = new Map<string, string>()
    for (const [path, spec] of Object.entries(randomize)) {
      const key = path.split('.').pop()
      if (!key || seen.has(key)) continue
      const label = spec.type === 'ai' ? '✨ ai' : spec.type === 'fixed' ? '⟳ fixed' : '⟳ ' + spec.type
      seen.set(key, label)
    }
    return [...seen.entries()].map(([key, label]) => ({ key, label }))
  }, [randomize])
  const dirty =
    method !== initial.method ||
    path !== initial.path ||
    status !== initial.status ||
    delayMs !== initial.delayMs ||
    body !== initial.body ||
    JSON.stringify(randomize) !== JSON.stringify(initial.randomize)
  const canSave = !saving && !jsonError && path.trim().length > 1

  async function save() {
    if (!canSave) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveMock({ id: initial.id, method, path: path.trim(), status, delayMs, body, randomize })
      onSaved()
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  // ⌘S save · Esc close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const title = initial.id === null ? 'New mock' : path

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg text-fg">
      {/* header */}
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-4">
        <button onClick={onClose} className="text-[13px] text-muted hover:text-fg">
          ← Catalog
        </button>
        <span className="text-muted">›</span>
        <span className="font-mono text-[13px]">{title}</span>
        <div className="ml-auto flex items-center gap-3">
          {dirty && <span className="text-[12px] text-warning">Unsaved changes</span>}
          <button
            onClick={onClose}
            className="h-[30px] rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
          >
            Discard
          </button>
          <button
            onClick={() => void save()}
            disabled={!canSave}
            className="h-[30px] rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-accent-on disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save mock'}
          </button>
        </div>
      </header>

      {/* request bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-[10px] border-b border-border px-4 py-[14px]">
        <div className="relative">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className={`h-[36px] cursor-pointer appearance-none rounded-[9px] pl-3 pr-8 font-mono text-[13px] font-semibold outline-none ${METHOD_BADGE[method]}`}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[9px] opacity-70">
            ▼
          </span>
        </div>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/api/v1/resource"
          className="h-[36px] min-w-[240px] flex-1 rounded-[9px] border border-border bg-surface px-3 font-mono text-[13.5px] outline-none focus:border-accent"
        />
        <label className="flex h-[36px] items-center gap-2 rounded-[9px] border border-border px-3">
          <span className="text-[12.5px] text-muted">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
            className="bg-transparent font-mono text-[13px] text-accent-text outline-none"
          >
            {(COMMON_STATUS.includes(status) ? COMMON_STATUS : [status, ...COMMON_STATUS]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-[36px] items-center gap-2 rounded-[9px] border border-border px-3">
          <span className="text-[12.5px] text-muted">Delay</span>
          <input
            type="range"
            min={0}
            max={30000}
            step={50}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
            className="w-[110px] accent-[var(--accent)]"
          />
          <span className="w-[56px] font-mono text-[13px]">{delayMs}ms</span>
        </label>
      </div>

      {saveError && (
        <div className="shrink-0 border-b border-border bg-del-bg px-4 py-2 text-[12.5px] text-del-fg">
          {saveError}
        </div>
      )}

      {/* body + side panel */}
      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col border-r border-border">
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
            <span className="text-[13px] font-semibold">Response body</span>
            <span className={`font-mono text-[11.5px] ${jsonError ? 'text-error' : 'text-muted'}`}>
              {jsonError ? `JSON · ${jsonError}` : 'JSON · valid'}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                disabled
                title="Describe the JSON you need and let AI build it — coming soon (see roadmap)"
                className="flex cursor-not-allowed items-center gap-1 text-[12px] font-medium text-param opacity-50"
              >
                ✨ AI JSON <span className="text-[9px] opacity-70">beta</span>
              </button>
              <button
                onClick={() => {
                  if (!jsonError) setBody(JSON.stringify(JSON.parse(body.trim() || '{}'), null, 2))
                }}
                className="text-[12px] text-muted hover:text-fg"
              >
                Format
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              value={body}
              onChange={setBody}
              highlights={highlights}
              onSelectField={(p) => {
                if (p) {
                  setSelectedField(p)
                  setTab('data')
                }
              }}
            />
          </div>
          <div className="shrink-0 border-t border-border px-4 py-2 font-mono text-[11.5px] text-muted">
            ⌘S save · esc close
          </div>
        </section>

        <aside className="hidden w-[400px] shrink-0 flex-col lg:flex">
          <div className="flex shrink-0 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-[13px] capitalize ${
                  tab === t ? 'border-b-2 border-accent text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {tab === 'data' && (
              <DataTab
                body={body}
                config={randomize}
                setConfig={setRandomize}
                selectedField={selectedField}
              />
            )}
            {tab === 'headers' && <HeadersTab />}
            {tab === 'snippets' && <SnippetsTab method={method} path={path} />}
            {tab === 'test' && <TestTab method={method} path={path} />}
          </div>
        </aside>
      </div>
    </div>
  )
}
