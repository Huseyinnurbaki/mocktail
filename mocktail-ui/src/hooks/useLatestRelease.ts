import { useEffect, useState } from 'react'

// The latest version is published as a static file on our own domain (Cloudflare CDN) rather
// than the GitHub API — no rate limits, we own the payload, and it carries release highlights.
const VERSION_URL = 'https://getmocktail.com/version.json'

export type ReleaseState = {
  status: 'checking' | 'latest' | 'outdated' | 'unknown'
  latest?: string
  url?: string
  highlights?: string[]
}

// Session cache — check at most once per app run (and never block anything on it).
let releaseCache: ReleaseState | null = null

function cmpVer(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/**
 * Reads getmocktail.com/version.json once (per app run) and compares to the running version.
 * Entirely best-effort: any failure (offline, DNS, CORS, non-200, bad JSON, or a 5s timeout)
 * resolves to `unknown` — it never throws, never blocks render, and the app works regardless.
 */
export function useLatestRelease(): ReleaseState {
  const [state, setState] = useState<ReleaseState>(releaseCache ?? { status: 'checking' })
  useEffect(() => {
    if (releaseCache) return
    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000) // don't let a hanging endpoint linger
    fetch(VERSION_URL, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { version?: string; url?: string; highlights?: string[] }) => {
        const v = (d.version ?? '').trim()
        releaseCache = v
          ? {
              status: cmpVer(v, __APP_VERSION__) > 0 ? 'outdated' : 'latest',
              latest: v.replace(/^v/, ''),
              url: d.url,
              highlights: d.highlights,
            }
          : { status: 'unknown' }
        if (alive) setState(releaseCache)
      })
      .catch(() => {
        releaseCache = { status: 'unknown' }
        if (alive) setState(releaseCache)
      })
      .finally(() => clearTimeout(timer))
    // On unmount just stop updating state — let the request finish/cache in the background.
    return () => {
      alive = false
    }
  }, [])
  return state
}
