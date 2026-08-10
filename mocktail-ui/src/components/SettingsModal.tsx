import { useEffect, useState } from 'react'
import { importMocks, type ImportResult } from '../lib/api'
import { ACCENTS, type Accent, type Theme } from '../lib/theme'

export type SettingsTab = 'theme' | 'import' | 'apikeys'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'theme', label: 'Theme' },
  { id: 'import', label: 'Import' },
  { id: 'apikeys', label: 'API keys' },
]

export function SettingsModal({
  theme,
  setTheme,
  accent,
  setAccent,
  onImported,
  onClose,
  initialTab = 'theme',
}: {
  theme: Theme
  setTheme: (t: Theme) => void
  accent: Accent
  setAccent: (a: Accent) => void
  onImported: () => void
  onClose: () => void
  initialTab?: SettingsTab
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const active = TABS.find((t) => t.id === tab)!

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[440px] w-[640px] max-w-full overflow-hidden rounded-[14px] border border-border bg-surface shadow-2xl"
      >
        {/* vertical tabs */}
        <div className="flex w-[176px] shrink-0 flex-col border-r border-border bg-surface-sunken p-2">
          <div className="px-2 pb-2 pt-1 text-[13px] font-semibold">Settings</div>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-[7px] px-2 py-[7px] text-left text-[13px] ${
                tab === t.id ? 'bg-accent-tint text-accent-text' : 'hover:bg-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="mt-auto px-2 py-1 font-mono text-[11px] text-muted">v{__APP_VERSION__}</div>
        </div>

        {/* content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[14px] font-semibold">{active.label}</span>
            <button onClick={onClose} className="text-[15px] text-muted hover:text-fg">
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {tab === 'theme' && (
              <ThemeTab theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} />
            )}
            {tab === 'import' && <ImportTab onImported={onImported} />}
            {tab === 'apikeys' && <ApiKeysTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeTab({
  theme,
  setTheme,
  accent,
  setAccent,
}: {
  theme: Theme
  setTheme: (t: Theme) => void
  accent: Accent
  setAccent: (a: Accent) => void
}) {
  const opts: { id: Theme; label: string; desc: string }[] = [
    { id: 'system', label: 'System', desc: 'Match your OS appearance' },
    { id: 'light', label: 'Light', desc: 'Always light' },
    { id: 'dark', label: 'Dark', desc: 'Always dark' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Mode</div>
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => setTheme(o.id)}
            className={`flex items-center justify-between rounded-[9px] border px-3 py-2 text-left ${
              theme === o.id ? 'border-accent bg-accent-tint' : 'border-border hover:bg-surface-sunken'
            }`}
          >
            <span>
              <span className="text-[13px] font-medium">{o.label}</span>
              <span className="block text-[12px] text-muted">{o.desc}</span>
            </span>
            {theme === o.id && <span className="text-accent-text">✓</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Accent</div>
          <div className="text-[12px] text-muted">
            {ACCENTS.find((a) => a.id === accent)?.label}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 rounded-[11px] border border-border bg-surface-sunken px-3.5 py-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              title={a.label}
              aria-label={a.label}
              aria-pressed={accent === a.id}
              className={`flex h-[32px] w-[32px] items-center justify-center rounded-full ring-offset-2 ring-offset-surface-sunken transition ${
                accent === a.id
                  ? 'ring-2 ring-accent'
                  : 'ring-1 ring-transparent hover:scale-110 hover:ring-fg/25'
              }`}
            >
              <span
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-white shadow-sm ring-1 ring-inset ring-black/10"
                style={{ background: `oklch(0.68 0.15 ${a.hue})` }}
              >
                {accent === a.id && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ImportTab({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setErr(null)
    setResult(null)
    try {
      const r = await importMocks(text)
      setResult(r)
      onImported()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) void f.text().then(setText)
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="text-[12.5px] text-muted">
        Paste exported mocks JSON (an array or <span className="font-mono">{'{ "Apis": [...] }'}</span>),
        or choose a file. Existing paths are skipped.
      </div>
      <input type="file" accept="application/json,.json" onChange={onFile} className="text-[12px]" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={'[ { "Method": "GET", "Endpoint": "/api/v1/users", "Response": { } } ]'}
        className="w-full resize-none rounded-[8px] border border-border bg-surface-sunken p-3 font-mono text-[12px] outline-none"
      />
      <button
        onClick={() => void run()}
        disabled={busy || !text.trim()}
        className="h-[32px] rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
      >
        {busy ? 'Importing…' : 'Import mocks'}
      </button>
      {err && <div className="text-[12.5px] text-error">{err}</div>}
      {result && (
        <div className="text-[12.5px] text-muted">
          Imported <span className="text-success">{result.imported}</span> · skipped {result.skipped}{' '}
          · failed {result.failed}
        </div>
      )}
    </div>
  )
}

function ApiKeysTab() {
  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="rounded-[9px] border border-dashed border-border p-3 text-[12.5px] text-muted">
        AI provider keys are configured via environment for now (
        <span className="font-mono">MOCKTAIL_AI_PROVIDER</span>,{' '}
        <span className="font-mono">MOCKTAIL_AI_API_KEY</span>). In-app key management arrives with AI
        generation. <span className="font-medium text-param">beta</span>
      </div>
      <label className="text-[12.5px] text-muted">Provider</label>
      <select
        disabled
        className="h-[34px] rounded-[8px] border border-border bg-surface px-2 text-[13px] opacity-50"
      >
        <option>Anthropic (Claude)</option>
        <option>OpenAI</option>
        <option>Google Gemini</option>
      </select>
      <label className="text-[12.5px] text-muted">API key</label>
      <input
        disabled
        placeholder="sk-…"
        className="h-[34px] rounded-[8px] border border-border bg-surface px-2 font-mono text-[13px] opacity-50"
      />
    </div>
  )
}
