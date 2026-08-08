import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  COMMON_STATUS,
  METHODS,
  type Draft,
  type FieldSpec,
  type Method,
  type RandomizeConfig,
} from '../lib/mocks'
import { previewMock, saveMock, sendMock, type TestResult } from '../lib/api'
import { ResponseView } from './ResponseView'
import { CodeEditor } from './CodeEditor'

function validateJson(text: string): string | null {
  if (!text.trim()) return null // empty is treated as {}
  try {
    JSON.parse(text)
    return null
  } catch (e) {
    return e instanceof Error ? e.message.replace(/^JSON\.parse: /, '') : 'Invalid JSON'
  }
}

type Tab = 'data' | 'headers' | 'snippets' | 'test'
const TABS: Tab[] = ['data', 'headers', 'snippets', 'test']

const METHOD_COLOR: Record<Method, string> = {
  GET: 'bg-get-bg text-get-fg',
  POST: 'bg-post-bg text-post-fg',
  PUT: 'bg-put-bg text-put-fg',
  PATCH: 'bg-put-bg text-put-fg',
  DELETE: 'bg-del-bg text-del-fg',
}

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
            className={`h-[36px] cursor-pointer appearance-none rounded-[9px] pl-3 pr-8 font-mono text-[13px] font-semibold outline-none ${METHOD_COLOR[method]}`}
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

const NEEDS_RANGE = new Set(['number', 'float', 'price'])

/** How many concrete fields a dot-path resolves to (arrays expand to every element). */
function countTargets(data: unknown, segs: string[]): number {
  if (Array.isArray(data)) return data.reduce((n, item) => n + countTargets(item, segs), 0)
  if (segs.length === 0) return 1
  if (data && typeof data === 'object' && segs[0] in (data as object)) {
    return countTargets((data as Record<string, unknown>)[segs[0]], segs.slice(1))
  }
  return 0
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center gap-2 text-[12.5px]">
      <span className={`relative h-[18px] w-[32px] rounded-full transition-colors ${on ? 'bg-accent' : 'bg-border'}`}>
        <span
          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-surface transition-all ${on ? 'left-[16px]' : 'left-[2px]'}`}
        />
      </span>
      {label}
    </button>
  )
}

const FAKER_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Identifiers', types: ['uuid'] },
  { label: 'Person', types: ['firstName', 'lastName', 'fullName'] },
  { label: 'Contact', types: ['email', 'phone', 'username'] },
  { label: 'Internet', types: ['url', 'domain', 'ipv4'] },
  { label: 'Numbers', types: ['number', 'float', 'price'] },
  { label: 'Text', types: ['word', 'sentence', 'paragraph'] },
  { label: 'Dates', types: ['pastDate', 'futureDate'] },
  { label: 'Location', types: ['city', 'country', 'countryCode'] },
  { label: 'Misc', types: ['bool', 'hexColor'] },
]

/** Searchable, grouped generator dropdown; special modes (Custom / AI) set apart in accent. */
function GeneratorPicker({ value, onChange }: { value: string | undefined; onChange: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [query, setQuery] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const MENU_W = 210

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: Math.max(8, r.right - MENU_W) })
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
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const isSpecial = value === 'fixed' || value === 'ai'
  const label = !value ? '— keep —' : value === 'fixed' ? 'Custom' : value === 'ai' ? '✨ AI prompt' : value
  const item = 'block w-full rounded-[5px] px-2 py-1 text-left text-[12px] hover:bg-surface-sunken'

  function pick(v: string) {
    onChange(v)
    setOpen(false)
  }

  const q = query.trim().toLowerCase()
  const groups = q
    ? FAKER_GROUPS.map((g) => ({ ...g, types: g.types.filter((t) => t.toLowerCase().includes(q)) })).filter(
        (g) => g.types.length,
      )
    : FAKER_GROUPS

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex items-center gap-1 rounded-[6px] border px-2 py-[3px] text-[12px] ${
          value
            ? isSpecial
              ? 'border-param/50 bg-param/15 text-param'
              : 'border-border bg-accent-tint text-accent-text'
            : 'border-border bg-surface text-muted'
        }`}
      >
        {label} <span className="text-[9px] opacity-70">▼</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
            className="fixed z-50 flex max-h-[340px] flex-col overflow-hidden rounded-[8px] border border-border bg-surface shadow-lg"
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
                placeholder="Search generators…"
                className="w-full rounded-[5px] bg-surface-sunken px-2 py-1 text-[12px] outline-none placeholder:text-muted"
              />
            </div>
            <div className="overflow-auto p-1">
              {!q && (
                <>
                  <button onClick={() => pick('')} className={`${item} ${!value ? 'text-accent-text' : 'text-muted'}`}>
                    — keep —
                  </button>
                  <button onClick={() => pick('fixed')} className={`${item} font-medium text-param`}>
                    Custom (fixed value)
                  </button>
                  <button
                    disabled
                    title="AI generation isn't wired yet — see roadmap"
                    className={`${item} cursor-not-allowed font-medium text-param opacity-50`}
                  >
                    ✨ AI prompt <span className="text-[9px] opacity-70">soon</span>
                  </button>
                  <div className="my-1 border-t border-border-subtle" />
                </>
              )}
              {groups.map((g) => (
                <div key={g.label}>
                  <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                    {g.label}
                  </div>
                  {g.types.map((ty) => (
                    <button
                      key={ty}
                      onClick={() => pick(ty)}
                      className={`${item} flex items-center justify-between font-mono ${value === ty ? 'text-accent-text' : ''}`}
                    >
                      <span>{ty}</span>
                      {value === ty && <span>✓</span>}
                    </button>
                  ))}
                </div>
              ))}
              {q && groups.length === 0 && <div className="px-2 py-2 text-[12px] text-muted">No match</div>}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

/** Single-field inspector: configure the field clicked in the editor. */
function DataTab({
  body,
  config,
  setConfig,
  selectedField,
}: {
  body: string
  config: RandomizeConfig
  setConfig: (c: RandomizeConfig) => void
  selectedField: string | null
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  let parsed: unknown = null
  let parseError = false
  try {
    parsed = JSON.parse(body.trim() || '{}')
  } catch {
    parseError = true
  }

  if (parseError) {
    return (
      <div className="text-[12.5px] text-error">
        Fix the JSON in the editor to configure randomized fields.
      </div>
    )
  }
  if (!selectedField) {
    return (
      <div className="text-[12.5px] text-muted">
        Click a field in the editor to set how it’s generated. Configured fields are highlighted;
        values regenerate on every request unless you turn that off.
      </div>
    )
  }

  const field = selectedField
  const segs = field.split('.')
  const indexLessSegs = segs.filter((s) => !/^\d+$/.test(s))
  const indexLess = indexLessSegs.join('.')
  const hasIndex = indexLess !== field
  const key = indexLessSegs[indexLessSegs.length - 1]
  const count = countTargets(parsed, indexLessSegs)
  // Scope: index-less key applies to all elements; the indexed key targets just this one.
  const scopeThis = !!config[field]
  const activeKey = scopeThis ? field : indexLess
  const spec = config[activeKey]

  function update(patch: Partial<FieldSpec> | null) {
    const next = { ...config }
    if (patch === null) delete next[activeKey]
    else next[activeKey] = { ...next[activeKey], ...patch }
    setConfig(next)
  }

  function setScopeAll(all: boolean) {
    const from = all ? field : indexLess
    const to = all ? indexLess : field
    if (from === to) return
    const next = { ...config }
    if (next[from]) {
      next[to] = next[from]
      delete next[from]
      setConfig(next)
    }
  }

  async function runPreview() {
    if (!spec) return
    setBusy(true)
    setPreviewErr(null)
    try {
      setPreview(await previewMock(body, { [activeKey]: spec }))
    } catch (e: unknown) {
      setPreviewErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.06em] text-muted">Field</div>
        <div className="font-mono text-[13px]">{indexLess}</div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12.5px] text-muted">Generator</span>
        <GeneratorPicker value={spec?.type} onChange={(v) => update(v ? { type: v } : null)} />
      </div>

      {spec && hasIndex && count > 1 && (
        <Toggle
          on={!scopeThis}
          onChange={setScopeAll}
          label={`Apply to all ${count} “${key}” at this level`}
        />
      )}

      {spec && NEEDS_RANGE.has(spec.type) && (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="min"
            value={spec.min ?? ''}
            onChange={(e) => update({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-[72px] rounded-[6px] border border-border bg-surface px-2 py-[3px] font-mono text-[12px] outline-none"
          />
          <input
            type="number"
            placeholder="max"
            value={spec.max ?? ''}
            onChange={(e) => update({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-[72px] rounded-[6px] border border-border bg-surface px-2 py-[3px] font-mono text-[12px] outline-none"
          />
        </div>
      )}

      {spec?.type === 'fixed' && (
        <input
          placeholder="fixed value"
          value={String(spec.value ?? '')}
          onChange={(e) => update({ value: e.target.value })}
          className="w-full rounded-[6px] border border-border bg-surface px-2 py-[3px] font-mono text-[12px] outline-none"
        />
      )}

      {spec && spec.type !== 'fixed' && (
        <div className="flex flex-col gap-1">
          <Toggle on={!spec.once} onChange={(v) => update({ once: !v })} label="Regenerate on every request" />
          {spec.once && (
            <div className="text-[11px] text-muted">
              Frozen — generated once and baked into the response when you save.
            </div>
          )}
        </div>
      )}

      {spec && (
        <div>
          <button
            onClick={() => void runPreview()}
            disabled={busy}
            className="h-[30px] w-full rounded-[8px] border border-border text-[13px] hover:bg-surface-sunken disabled:opacity-40"
          >
            {busy ? 'Generating…' : '⟳ Preview'}
          </button>
          {previewErr && <div className="mt-2 text-[12.5px] text-error">{previewErr}</div>}
          {preview && (
            <div className="mt-2">
              <ResponseView body={preview} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HeadersTab() {
  return (
    <div className="rounded-[9px] border border-dashed border-border p-3 text-[12.5px] text-muted">
      Custom response headers land in <span className="font-semibold text-fg">v4</span> (new backend
      field). Editor UI arrives with it.
    </div>
  )
}

const LANGS = ['cURL', 'Node', 'Python', 'Go'] as const
type Lang = (typeof LANGS)[number]

function snippetFor(lang: Lang, method: string, path: string): string {
  const url = `http://localhost:4000/mocktail${path}`
  switch (lang) {
    case 'cURL':
      return `curl -X ${method} '${url}'`
    case 'Node':
      return `const res = await fetch('${url}', {\n  method: '${method}',\n})\nconst data = await res.json()`
    case 'Python':
      return `import requests\n\nres = requests.request('${method}', '${url}')\nprint(res.json())`
    case 'Go':
      return `req, _ := http.NewRequest("${method}", "${url}", nil)\nres, _ := http.DefaultClient.Do(req)\ndefer res.Body.Close()`
  }
}

const SNIPPET_KEYWORDS: Record<Lang, string[]> = {
  cURL: ['curl'],
  Node: ['const', 'await', 'fetch'],
  Python: ['import', 'requests', 'print'],
  Go: ['req', 'res', 'http', 'NewRequest', 'DefaultClient', 'Do', 'defer', 'nil'],
}

const METHOD_TEXT: Record<Method, string> = {
  GET: 'text-get-fg',
  POST: 'text-post-fg',
  PUT: 'text-put-fg',
  PATCH: 'text-put-fg',
  DELETE: 'text-del-fg',
}

/** Tiny display-only highlighter: strings → coral, keywords → periwinkle, method → its color. */
function highlightSnippet(code: string, lang: Lang, method: Method) {
  const kw = SNIPPET_KEYWORDS[lang].join('|')
  const re = new RegExp(`('[^']*'|"[^"]*")|\\b(GET|POST|PUT|PATCH|DELETE)\\b|\\b(${kw})\\b`, 'g')
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index))
    if (m[1]) {
      out.push(
        <span key={i} className="text-error">
          {m[1]}
        </span>,
      )
    } else if (m[2]) {
      out.push(
        <span key={i} className={`font-semibold ${METHOD_TEXT[m[2] as Method]}`}>
          {m[2]}
        </span>,
      )
    } else if (m[3]) {
      out.push(
        <span key={i} className="text-param">
          {m[3]}
        </span>,
      )
    }
    last = m.index + m[0].length
    i++
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

function SnippetsTab({ method, path }: { method: Method; path: string }) {
  const [lang, setLang] = useState<Lang>('cURL')
  const [copied, setCopied] = useState(false)
  const code = snippetFor(lang, method, path)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-w-0">
      {/* language segmented control */}
      <div className="mb-3 flex gap-[2px] rounded-[8px] border border-border p-[2px]">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`flex-1 rounded-[6px] py-[5px] text-[12px] ${
              lang === l ? 'bg-accent-tint text-accent-text' : 'text-muted hover:text-fg'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="truncate font-mono text-[11.5px] text-muted">
          {method} {path}
        </span>
        <button
          onClick={() => void copy()}
          className="ml-auto shrink-0 text-[12px] text-accent-text hover:underline"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="w-full whitespace-pre-wrap break-all rounded-[9px] border border-border bg-surface-sunken p-3 font-mono text-[11.5px] leading-[1.7]">
        {highlightSnippet(code, lang, method)}
      </pre>
    </div>
  )
}

function TestTab({ method, path }: { method: Method; path: string }) {
  const [result, setResult] = useState<TestResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setErr(null)
    try {
      setResult(await sendMock(method, path))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => void send()}
        disabled={busy}
        className="h-[32px] w-full rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
      >
        {busy ? 'Sending…' : '▶ Send request'}
      </button>
      <div className="mt-2 text-[12px] text-muted">Save the mock first so the endpoint exists.</div>
      {err && <div className="mt-3 text-[12.5px] text-error">{err}</div>}
      {result && (
        <div className="mt-3">
          <div className="mb-1 font-mono text-[12px]">
            <span className={result.status < 300 ? 'text-success' : 'text-error'}>
              {result.status}
            </span>{' '}
            · {result.ms}ms
          </div>
          <ResponseView body={result.body} />
        </div>
      )}
    </div>
  )
}
