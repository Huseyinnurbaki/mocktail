import { statusBadgeClass } from '../../lib/format'

/** HTTP status pill, colored by class (2xx/3xx/4xx…). */
export function StatusBadge({ status }: { status?: number }) {
  return (
    <span
      className={`inline-flex h-[18px] min-w-[36px] shrink-0 items-center justify-center rounded-[5px] px-1 font-mono text-[11px] font-semibold ${statusBadgeClass(
        status ?? 0,
      )}`}
    >
      {status}
    </span>
  )
}
