import { useEffect, useMemo, useState } from 'react'
import { METHODS, type Draft, type Method, type RandomizeConfig } from '../lib/mocks'
import { saveMock, sendMock, type TestResult } from '../lib/api'
import { METHOD_BADGE } from '../lib/methods'
import { validateJson } from '../lib/json'
import { CodeEditor } from './CodeEditor'
import { DataTab } from './editor/DataTab'
import { HeadersTab } from './editor/HeadersTab'
import { TestTab } from './editor/TestTab'
import { StatusPicker } from './editor/StatusPicker'

type Tab = 'data' | 'headers' | 'test'
const TABS: Tab[] = ['data', 'headers', 'test']


export default function Editor({
  initial,
  onClose,
  onReload,
}: {
  initial: Draft
  onClose: () => void
  onReload: () => void
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
  // Live identity + the last-saved baseline, so we can save in place without closing.
  const [currentId, setCurrentId] = useState(initial.id)
  const [baseline, setBaseline] = useState(() => ({
    method: initial.method,
    path: initial.path,
    status: initial.status,
    delayMs: initial.delayMs,
    body: initial.body,
    randomize: initial.randomize,
  }))

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
    method !== baseline.method ||
    path !== baseline.path ||
    status !== baseline.status ||
    delayMs !== baseline.delayMs ||
    body !== baseline.body ||
    JSON.stringify(randomize) !== JSON.stringify(baseline.randomize)
  const canSave = !saving && !jsonError && path.trim().length > 1

  /** Save in place (POST if new, PUT if existing), refresh the catalog, keep the editor open. */
  async function persist(): Promise<boolean> {
    if (!canSave) return false
    setSaving(true)
    setSaveError(null)
    try {
      const id = await saveMock({ id: currentId, method, path: path.trim(), status, delayMs, body, randomize })
      setCurrentId(id)
      setBaseline({ method, path: path.trim(), status, delayMs, body, randomize })
      onReload()
      return true
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e))
      return false
    } finally {
      setSaving(false)
    }
  }

  async function save() {
    void persist() // save in place — does not close the editor
  }

  // First test on a never-saved mock saves then sends; afterwards it sends the saved version,
  // with a note if there are unsaved edits.
  async function runTest(): Promise<{ result?: TestResult; note?: string; error?: string }> {
    if (currentId === null) {
      if (!(await persist())) return { error: 'Fix the errors above, then try again.' }
      try {
        return { result: await sendMock(method, path.trim()) }
      } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : String(e) }
      }
    }
    try {
      const result = await sendMock(baseline.method, baseline.path)
      return { result, note: dirty ? 'Testing the last saved version — you have unsaved changes.' : undefined }
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : String(e) }
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

  const title = currentId === null ? 'New mock' : path

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
            Close
          </button>
          <button
            onClick={() => void save()}
            disabled={!canSave || !dirty}
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
        <StatusPicker value={status} onChange={setStatus} />
        <div className="flex h-[36px] items-center gap-2 rounded-[9px] border border-border px-3">
          <span className="text-[12.5px] text-muted">Delay</span>
          <input
            type="range"
            min={0}
            max={30000}
            step={50}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
            className="w-[100px] accent-[var(--accent)]"
          />
          <input
            type="number"
            min={0}
            max={30000}
            value={delayMs === 0 ? '' : delayMs}
            placeholder="0"
            onChange={(e) => {
              const n = Math.floor(Number(e.target.value))
              setDelayMs(Number.isFinite(n) ? Math.min(30000, Math.max(0, n)) : 0)
            }}
            className="w-[56px] bg-transparent text-right font-mono text-[13px] outline-none placeholder:text-muted"
          />
          <span className="text-[12px] text-muted">ms</span>
        </div>
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
            <button
              onClick={() => {
                if (!jsonError) setBody(JSON.stringify(JSON.parse(body.trim() || '{}'), null, 2))
              }}
              className="ml-auto text-[12px] text-muted hover:text-fg"
            >
              Format
            </button>
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
            {tab === 'test' && (
              <TestTab isNew={currentId === null} method={method} path={path} onRun={runTest} />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
