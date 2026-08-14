import { useEffect, useState } from 'react'
import { type Accent, type Theme } from '../lib/theme'
import { useLatestRelease } from '../hooks/useLatestRelease'
import { FaqAccordion } from './FaqAccordion'
import { ThemeTab } from './settings/ThemeTab'
import { ImportTab } from './settings/ImportTab'
import { ApiKeysTab } from './settings/ApiKeysTab'

export type SettingsTab = 'theme' | 'import' | 'apikeys' | 'help'

// Landing page. Update-available sends users here for install/upgrade docs, not the raw GitHub
// release. The `#install` section is the contract — keep it on the landing page.
const SITE_URL = 'https://getmocktail.com/#install'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'theme', label: 'Theme' },
  { id: 'import', label: 'Import' },
  { id: 'apikeys', label: 'API keys' },
  { id: 'help', label: 'Help' },
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
                href={release.url ?? SITE_URL}
                target="_blank"
                rel="noreferrer noopener"
                title={`Update available — v${release.latest}${
                  release.highlights?.length
                    ? '\n\n' + release.highlights.map((h) => `• ${h}`).join('\n')
                    : ''
                }\n\nClick for install & upgrade docs.`}
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
            {tab === 'help' && <FaqAccordion />}
          </div>
        </div>
      </div>
    </div>
  )
}
