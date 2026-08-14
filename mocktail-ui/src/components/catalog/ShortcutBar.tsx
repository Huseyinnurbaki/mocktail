import { MOD } from '../../lib/platform'

/** Bottom hint bar — static hints plus clickable new / live / settings actions. */
export function ShortcutBar({
  onNew,
  onLive,
  onSettings,
}: {
  onNew: () => void
  onLive: () => void
  onSettings: () => void
}) {
  const action = 'text-accent-text transition-colors hover:text-accent'
  return (
    <div className="shrink-0 overflow-x-auto whitespace-nowrap border-t border-border px-[18px] py-2 font-mono text-[11.5px] text-muted">
      ↑↓ navigate · ↵ open · {MOD}↵ run · {MOD}C copy · {MOD}D duplicate ·{' '}
      <button onClick={onNew} className={action}>
        {MOD}E new
      </button>{' '}
      ·{' '}
      <button onClick={onLive} className={action}>
        {MOD}L live
      </button>{' '}
      ·{' '}
      <button onClick={onSettings} className={action}>
        {MOD}O settings
      </button>
    </div>
  )
}
