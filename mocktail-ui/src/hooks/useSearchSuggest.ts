import { useMemo } from 'react'
import type { Mock } from '../lib/mocks'

/**
 * Inline search completion. Returns the dimmed tail to show after what the user typed — the
 * shortest base-path prefix one segment deeper — so pressing Tab drills the path one level at a
 * time. Empty when there's nothing to complete.
 */
export function useSearchSuggest(mocks: Mock[], query: string): string {
  // Every cumulative base-path prefix (both "/api/v1" and "api/v1" forms), so completion works
  // whether or not the user typed a leading slash. e.g. /api/v1/users → /api, /api/v1, /api/v1/users.
  const prefixes = useMemo(() => {
    const set = new Set<string>()
    for (const m of mocks) {
      const clean = m.path.replace(/^\/+/, '')
      if (!clean) continue
      let acc = ''
      for (const seg of clean.split('/')) {
        acc = acc ? acc + '/' + seg : seg
        set.add('/' + acc)
        set.add(acc)
      }
    }
    return Array.from(set)
  }, [mocks])

  return useMemo(() => {
    if (!query.trim()) return ''
    const lower = query.toLowerCase()
    let best = ''
    for (const p of prefixes) {
      if (p.length > query.length && p.toLowerCase().startsWith(lower) && (!best || p.length < best.length)) {
        best = p
      }
    }
    return best ? best.slice(query.length) : ''
  }, [query, prefixes])
}
