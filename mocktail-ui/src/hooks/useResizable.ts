import { useEffect, useState } from 'react'

/**
 * Width of a right-docked panel with a drag handle on its left edge, persisted to localStorage
 * under `key`. Dragging is clamped to [min, max], to `maxFraction` of the window, and so that at
 * least `reserve` px stay for the rest of the page — the handle never keeps moving past the point
 * where the panel stops growing. Mirror the same limits in the panel's CSS width.
 */
export function useResizable(key: string, initial: number, min: number, max: number, maxFraction = 1, reserve = 0) {
  const [width, setWidth] = useState(() => {
    try {
      const v = Number(localStorage.getItem(key))
      return v >= min && v <= max ? v : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, String(width))
    } catch {
      /* storage disabled */
    }
  }, [key, width])

  const clamp = (w: number) =>
    Math.round(Math.max(min, Math.min(max, window.innerWidth * maxFraction, window.innerWidth - reserve, w)))

  // Pointer events (not mouse) so touch and pen can drag too; capture keeps the drag alive when the
  // pointer leaves the thin handle.
  function startResize(e: React.PointerEvent<HTMLElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => setWidth(clamp(window.innerWidth - ev.clientX))
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  /** Grow (positive) or shrink the panel by `delta` px — for keyboard resizing. */
  const nudge = (delta: number) => setWidth((w) => clamp(w + delta))
  const reset = () => setWidth(clamp(initial))

  return { width, startResize, nudge, reset }
}
