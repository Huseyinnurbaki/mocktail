import { Mark } from '../Mark'

export function TopBar({
  connected,
  port,
  onOpenLive,
  onNew,
  onToggleTree,
}: {
  connected: boolean
  port?: number
  onOpenLive: () => void
  onNew: () => void
  onToggleTree?: () => void
}) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border px-4">
      {onToggleTree && (
        <button
          onClick={onToggleTree}
          aria-label="Toggle base-path menu"
          className="-ml-1 shrink-0 rounded-[7px] p-1.5 text-muted hover:bg-surface-sunken hover:text-fg lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
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
        onClick={onOpenLive}
        className="ml-auto flex h-[30px] items-center gap-1.5 rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
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
