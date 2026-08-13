import { memo } from 'react'
import { MethodBadge } from '../MethodBadge'
import { StatusBadge } from './StatusBadge'

/** One traffic row — memoized on primitive props so unchanged rows skip re-render across polls. */
export const LiveRow = memo(function LiveRow({
  method,
  status,
  path,
  duration,
  time,
  selected,
  index,
  onSelect,
}: {
  method?: string
  status?: number
  path: string
  duration?: string
  time: string
  selected: boolean
  index: number
  onSelect: (i: number) => void
}) {
  return (
    <button
      data-live-row={index}
      onClick={() => onSelect(index)}
      style={selected ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-[18px] py-[9px] text-left focus:outline-none ${
        selected ? 'bg-accent-tint' : 'hover:bg-surface-sunken'
      }`}
    >
      <MethodBadge method={method} />
      <StatusBadge status={status} />
      <span className="flex-1 truncate font-mono text-[13px]">{path}</span>
      <span className="shrink-0 font-mono text-[11.5px] text-muted">{duration}</span>
      <span className="w-[64px] shrink-0 text-right font-mono text-[11.5px] text-muted">{time}</span>
    </button>
  )
})
