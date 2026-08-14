import type { Mock } from '../../lib/mocks'
import { statusColor } from '../../lib/format'
import { MethodBadge } from '../MethodBadge'
import { PathText } from '../PathText'

export function CatalogRow({
  mock,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
}: {
  mock: Mock
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      style={selected ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-[18px] py-[13px] text-left focus:outline-none ${
        selected ? 'bg-accent-tint' : 'hover:bg-surface-sunken'
      }`}
    >
      <MethodBadge method={mock.method} />
      <PathText path={mock.path} title={mock.path} className="min-w-0 flex-1 truncate pr-4 text-[13.5px]" />
      <span className={`font-mono text-[12px] ${statusColor(mock.status)}`}>{mock.status}</span>
      <span
        className={`w-[64px] text-right font-mono text-[12px] ${mock.delayMs > 0 ? 'text-warning' : 'text-muted'}`}
      >
        {mock.delayMs}ms
      </span>
    </button>
  )
}
