import { Mark } from '../Mark'

export function TopBar({
  connected,
  port,
  onOpenLive,
  onOpenSettings,
  onNew,
}: {
  connected: boolean
  port?: number
  onOpenLive: () => void
  onOpenSettings: () => void
  onNew: () => void
}) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Mark className="h-[22px] w-[22px] text-accent" />
        <span className="text-[15px] font-semibold">Mocktail</span>
      </div>

      {/* server status pill — reflects backend connectivity */}
      <span
        className={`ml-1 inline-flex items-center gap-[6px] rounded-full py-[4px] pl-[7px] pr-[9px] font-mono text-[11.5px] ${
          connected ? 'bg-accent-tint text-accent-text' : 'bg-del-bg text-del-fg'
        }`}
      >
        <span className={`h-[6px] w-[6px] rounded-full ${connected ? 'bg-accent' : 'bg-error'}`} />
        {connected ? `running · localhost:${port ?? 6625}` : 'stopped'}
      </span>

      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings (⌘O)"
        className="ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-[8px] border border-border text-muted hover:bg-surface-sunken hover:text-fg"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <button
        onClick={onOpenLive}
        title="Live traffic (⌘L)"
        className="flex h-[30px] items-center gap-1.5 rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
      >
        <span className="text-accent">◉</span> Live
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
