/** A titled key: value list (headers, query params) above a body in the Live detail panel. */
export function HeaderList({ title, entries }: { title: string; entries: [string, string][] }) {
  if (entries.length === 0) return null
  return (
    <div className="shrink-0 border-b border-border px-4 py-2">
      <div className="mb-1 text-[10px] uppercase tracking-[0.06em] text-muted">{title}</div>
      <div className="flex max-h-[120px] flex-col gap-[2px] overflow-auto font-mono text-[11px]">
        {entries.map(([k, v], i) => (
          <div key={`${k}-${i}`} className="flex gap-2">
            <span className="shrink-0 text-muted">{k}:</span>
            <span className="min-w-0 break-all">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
