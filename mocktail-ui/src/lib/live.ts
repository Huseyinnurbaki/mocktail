/** Strip the /mocktail prefix for display (empty path → "/"). */
export const strip = (p?: string) => (p ?? '').replace(/^\/mocktail/, '') || '/'

/** Status-class bucket for filtering, e.g. 200 → "2xx". Empty for missing/invalid codes. */
export function statusClass(status?: number): string {
  if (!status || status < 100) return ''
  return `${Math.floor(status / 100)}xx`
}

/** A request path matches the selection if it equals an exact entry or falls under a `/prefix/*` entry. */
export function pathMatches(path: string, selected: Set<string>): boolean {
  if (selected.size === 0) return true
  for (const sel of selected) {
    if (sel.endsWith('/*')) {
      if (path.startsWith(sel.slice(0, -1))) return true // '/api/v1/*' → prefix '/api/v1/'
    } else if (path === sel) {
      return true
    }
  }
  return false
}

/** Toggle membership of key in a Set, returning a new Set. */
export function toggleIn(set: Set<string>, key: string): Set<string> {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}
