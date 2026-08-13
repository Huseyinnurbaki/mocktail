import { useEffect, useState } from 'react'

const REPO = 'Huseyinnurbaki/mocktail'

export type ReleaseState = {
  status: 'checking' | 'latest' | 'outdated' | 'unknown'
  latest?: string
  url?: string
}

// Session cache — check GitHub at most once per app run (and never block anything on it).
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

/** Checks GitHub's latest release once (per app run) and compares to the running version. */
export function useLatestRelease(): ReleaseState {
  const [state, setState] = useState<ReleaseState>(releaseCache ?? { status: 'checking' })
  useEffect(() => {
    if (releaseCache) return
    let alive = true
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { tag_name?: string; html_url?: string }) => {
        const tag = (d.tag_name ?? '').trim()
        releaseCache = tag
          ? {
              status: cmpVer(tag, __APP_VERSION__) > 0 ? 'outdated' : 'latest',
              latest: tag.replace(/^v/, ''),
              url: d.html_url,
            }
          : { status: 'unknown' }
        if (alive) setState(releaseCache)
      })
      .catch(() => {
        releaseCache = { status: 'unknown' }
        if (alive) setState(releaseCache)
      })
    return () => {
      alive = false
    }
  }, [])
  return state
}
