import { useCallback, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const KEY = 'mocktail-theme'

export function getTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme) || 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', t)
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* private mode / storage disabled — theme still applies for the session */
  }
}

/** Apply the persisted theme before first paint. Call once at startup. */
export function initTheme() {
  applyTheme(getTheme())
}

/** system → light → dark → system */
export function nextTheme(t: Theme): Theme {
  return t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
  }, [])
  const cycle = useCallback(() => setTheme(nextTheme(getTheme())), [setTheme])
  return { theme, setTheme, cycle }
}
