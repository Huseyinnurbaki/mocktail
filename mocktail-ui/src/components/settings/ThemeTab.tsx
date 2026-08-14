import { ACCENTS, type Accent, type Theme } from '../../lib/theme'

export function ThemeTab({
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
