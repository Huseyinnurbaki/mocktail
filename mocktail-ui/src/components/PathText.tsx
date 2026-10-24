/**
 * Renders a path, tinting `:param` segments. With `keepTail`, a path too long for its box is cut in
 * the middle — `/api/v2/orga…/deployments` — so the last segment, usually the most telling part,
 * stays visible.
 */
export function PathText({
  path,
  className = '',
  title,
  keepTail = false,
}: {
  path: string
  className?: string
  title?: string
  keepTail?: boolean
}) {
  const parts = path.split('/')
  const seg = (s: string, i: number) => (
    <span key={i} className={s.startsWith(':') ? 'text-param' : undefined}>
      {i === 0 ? '' : '/'}
      {s}
    </span>
  )

  if (!keepTail || parts.length < 3) {
    return (
      <span title={title} className={`font-mono ${className}`}>
        {parts.map(seg)}
      </span>
    )
  }

  const last = parts.length - 1
  return (
    <span title={title} className={`flex min-w-0 whitespace-nowrap font-mono ${className}`}>
      <span className="min-w-0 truncate">{parts.slice(0, last).map(seg)}</span>
      {/* the tail shrinks only once the head is fully collapsed, and even then keeps most of the box */}
      <span className="max-w-[75%] shrink-0 truncate">{seg(parts[last], last)}</span>
    </span>
  )
}
