import { METHOD_BADGE } from '../lib/methods'
import type { Method } from '../lib/mocks'

/** Fixed-width method chip (GET/POST/…) in its method color. */
export function MethodBadge({ method }: { method?: string }) {
  const cls = METHOD_BADGE[method as Method] ?? 'bg-surface-sunken text-muted'
  return (
    <span
      className={`inline-flex h-[18px] w-[58px] shrink-0 items-center justify-center rounded-[5px] font-mono text-[11px] font-semibold ${cls}`}
    >
      {method}
    </span>
  )
}
