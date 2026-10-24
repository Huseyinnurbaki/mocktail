import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const DELAY_MS = 250
const GAP = 6
const MAX_W = 520

/** True when the element or anything inside it is cut off (e.g. a `truncate` span). */
function isClipped(el: HTMLElement): boolean {
  if (el.scrollWidth > el.clientWidth + 1) return true
  for (const child of el.querySelectorAll<HTMLElement>('*')) {
    if (child.scrollWidth > child.clientWidth + 1) return true
  }
  return false
}

/**
 * Wraps a single-line label and, after a short hover, shows `text` in full in a styled tooltip —
 * only when the label is actually truncated. Faster and more readable than a native `title`, and
 * it wraps long values instead of running off screen.
 */
export function OverflowTooltip({ text, className = '', children }: { text: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const timer = useRef<number>()
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null)

  const hide = () => {
    window.clearTimeout(timer.current)
    setPos(null)
  }

  function onEnter() {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el || !isClipped(el)) return
      const r = el.getBoundingClientRect()
      const left = Math.max(8, Math.min(r.left, window.innerWidth - MAX_W - 8))
      // Below the label, or above it when there's no room underneath.
      setPos(r.bottom + 80 < window.innerHeight ? { left, top: r.bottom + GAP } : { left, bottom: window.innerHeight - r.top + GAP })
    }, DELAY_MS)
  }

  // A scroll anywhere moves the label out from under a fixed-position tooltip — just close it.
  useEffect(() => {
    if (!pos) return
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [pos])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <span ref={ref} onMouseEnter={onEnter} onMouseLeave={hide} onMouseDown={hide} className={`min-w-0 ${className}`}>
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, maxWidth: `min(${MAX_W}px, calc(100vw - 16px))` }}
            className="pointer-events-none fixed z-50 rounded-[6px] border border-border bg-surface px-2.5 py-1.5 font-mono text-[12px] text-fg shadow-lg [overflow-wrap:anywhere]"
          >
            {text}
          </div>,
          document.body,
        )}
    </span>
  )
}
