import { useEffect, useState } from 'react'
import { importMocks, type ImportResult } from '../lib/api'
import { ACCENTS, type Accent, type Theme } from '../lib/theme'

export type SettingsTab = 'theme' | 'import' | 'apikeys'

const REPO = 'Huseyinnurbaki/mocktail'
// Landing page. Update-available sends users here for install/upgrade docs, not the raw GitHub
// release. The `#install` section is the contract — keep it on the landing page.
const SITE_URL = 'https://getmocktail.com/#install'

type ReleaseState = { status: 'checking' | 'latest' | 'outdated' | 'unknown'; latest?: string; url?: string }
// Session cache — check GitHub at most once per app run (and never block anything on it).
let releaseCache: ReleaseState | null = null

function cmpVer(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/** Checks GitHub's latest release once (on first Settings open) and compares to the running version. */
function useLatestRelease(): ReleaseState {
  const [state, setState] = useState<ReleaseState>(releaseCache ?? { status: 'checking' })
  useEffect(() => {
    if (releaseCache) return
    let alive = true
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { tag_name?: string; html_url?: string }) => {
        const tag = (d.tag_name ?? '').trim()
        releaseCache = tag
          ? {
              status: cmpVer(tag, __APP_VERSION__) > 0 ? 'outdated' : 'latest',
              latest: tag.replace(/^v/, ''),
              url: d.html_url,
            }
          : { status: 'unknown' }
        if (alive) setState(releaseCache)
      })
      .catch(() => {
        releaseCache = { status: 'unknown' }
        if (alive) setState(releaseCache)
      })
    return () => {
      alive = false
    }
  }, [])
  return state
}

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
  const release = useLatestRelease()

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
          <div className="mt-auto flex items-center gap-2 px-2 py-1">
            <a
              href="https://github.com/Huseyinnurbaki/mocktail"
              target="_blank"
              rel="noreferrer noopener"
              title="View Mocktail on GitHub"
              aria-label="View Mocktail on GitHub"
              className="text-muted transition-colors hover:text-fg"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58C20.56 22.29 24 17.79 24 12.5 24 5.87 18.63.5 12 .5Z" />
              </svg>
            </a>
            <span className="font-mono text-[11px] text-muted">v{__APP_VERSION__}</span>
            {release.status === 'outdated' ? (
              <a
                href={SITE_URL}
                target="_blank"
                rel="noreferrer noopener"
                title={`Update available — v${release.latest}. Click for install & upgrade docs.`}
                aria-label={`Update available: version ${release.latest}`}
                className="ml-auto text-accent-text transition-colors hover:text-accent"
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 16V8" />
                  <path d="M8.5 11.5 12 8l3.5 3.5" />
                </svg>
              </a>
            ) : release.status === 'latest' ? (
              <span
                title="Up to date — you’re on the latest version"
                aria-label="Up to date"
                className="ml-auto text-success"
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12 2.5 2.5 4.5-5" />
                </svg>
              </span>
            ) : null}
          </div>
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
