/** Renders a path, tinting `:param` segments. */
export function PathText({ path, className = '', title }: { path: string; className?: string; title?: string }) {
  const parts = path.split('/')
  return (
    <span title={title} className={`font-mono ${className}`}>
      {parts.map((seg, i) => (
        <span key={i} className={seg.startsWith(':') ? 'text-param' : undefined}>
          {i === 0 ? '' : '/'}
          {seg}
        </span>
      ))}
    </span>
  )
}
