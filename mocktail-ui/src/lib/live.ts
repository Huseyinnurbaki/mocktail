import type { LogEntry } from './api'

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

/**
 * Merge one incremental poll into the entries held client-side: drop what the server no longer
 * holds (id < firstId — evicted or cleared), append the new entries, keep the newest `max`.
 * Returns `prev` itself when nothing changed, so an idle poll doesn't re-render the list.
 */
export function mergeLogs(prev: LogEntry[], incoming: LogEntry[], firstId: number, max: number): LogEntry[] {
  let start = 0
  while (start < prev.length && prev[start].id < firstId) start++
  const lastId = prev.length > 0 ? prev[prev.length - 1].id : 0
  const fresh = incoming.filter((l) => l.id > lastId)
  if (start === 0 && fresh.length === 0 && prev.length <= max) return prev

  const next = start === 0 ? prev.concat(fresh) : prev.slice(start).concat(fresh)
  return next.length > max ? next.slice(next.length - max) : next
}

export type DetailTab = 'request' | 'response'

/** Tab the detail panel opens on until the user picks one: what was sent, if anything was. */
export function defaultTab(entry: Pick<LogEntry, 'requestSize'>): DetailTab {
  return (entry.requestSize ?? 0) > 0 ? 'request' : 'response'
}

/** A raw query string as ordered [key, value] pairs for display (duplicates kept). */
export function queryPairs(query?: string): [string, string][] {
  return query ? [...new URLSearchParams(query)] : []
}

const TAB_KEY = 'mocktail-live-tab'

/** The detail tab the user last picked, remembered across reloads (null = never picked). */
export function loadTab(): DetailTab | null {
  try {
    const v = localStorage.getItem(TAB_KEY)
    return v === 'request' || v === 'response' ? v : null
  } catch {
    return null // storage blocked (private mode, sandboxed preview) — fall back to the default
  }
}

export function saveTab(tab: DetailTab): void {
  try {
    localStorage.setItem(TAB_KEY, tab)
  } catch {
    // Not persisted; the choice still sticks for this page session.
  }
}

/**
 * The exact URL a logged request hit, for copying — same host convention as the catalog's Copy URL.
 * `path` is the logged path (it already includes /mocktail); `query` is the raw query string.
 */
export function requestUrl(port: number | null | undefined, path: string, query?: string): string {
  return `http://localhost:${port ?? 6625}${path}${query ? `?${query}` : ''}`
}
