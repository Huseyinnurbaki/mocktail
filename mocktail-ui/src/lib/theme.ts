import { useCallback, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

/** Accent palette (hue only) — pairs with any light/dark mode. */
export type Accent =
  | 'emerald'
  | 'teal'
  | 'ocean'
  | 'indigo'
  | 'violet'
  | 'magenta'
  | 'rose'
  | 'amber'
export const ACCENTS: { id: Accent; label: string; hue: number }[] = [
  { id: 'emerald', label: 'Emerald', hue: 165 },
  { id: 'teal', label: 'Teal', hue: 195 },
  { id: 'ocean', label: 'Ocean', hue: 245 },
  { id: 'indigo', label: 'Indigo', hue: 275 },
  { id: 'violet', label: 'Violet', hue: 300 },
  { id: 'magenta', label: 'Magenta', hue: 340 },
  { id: 'rose', label: 'Rose', hue: 15 },
  { id: 'amber', label: 'Amber', hue: 70 },
]

const KEY = 'mocktail-theme'
const ACCENT_KEY = 'mocktail-accent'

export function getTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme) || 'system'
  } catch {
    return 'system'
  }
}

export function getAccent(): Accent {
  try {
    const a = localStorage.getItem(ACCENT_KEY) as Accent
    return ACCENTS.some((x) => x.id === a) ? a : 'emerald'
  } catch {
    return 'emerald'
  }
}

export function applyAccent(a: Accent) {
  document.documentElement.setAttribute('data-accent', a)
  try {
    localStorage.setItem(ACCENT_KEY, a)
  } catch {
    /* storage disabled — accent still applies for the session */
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

/** Apply the persisted theme + accent before first paint. Call once at startup. */
export function initTheme() {
  applyTheme(getTheme())
  applyAccent(getAccent())
}

/** system → light → dark → system */
export function nextTheme(t: Theme): Theme {
  return t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [accent, setAccentState] = useState<Accent>(getAccent)
  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
  }, [])
  const setAccent = useCallback((a: Accent) => {
    applyAccent(a)
    setAccentState(a)
  }, [])
  const cycle = useCallback(() => setTheme(nextTheme(getTheme())), [setTheme])
  return { theme, setTheme, accent, setAccent, cycle }
}
