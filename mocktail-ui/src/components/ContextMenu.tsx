import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  label: string
  onClick: () => void
  confirm?: boolean // requires a second click on the same item
  confirmLabel?: string
  danger?: boolean
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState<string | null>(null) // resets when the menu unmounts
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && ref.current.contains(e.target as Node)) return
      onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const left = Math.min(x, window.innerWidth - 170)
  const top = Math.min(y, window.innerHeight - 8 - items.length * 30)

  return createPortal(
    <div
      ref={ref}
      style={{ top, left }}
      className="fixed z-50 min-w-[150px] rounded-[8px] border border-border bg-surface p-1 shadow-lg"
    >
      {items.map((it) => {
        const isArmed = armed === it.label
        return (
          <button
            key={it.label}
            onClick={() => {
              if (it.confirm && !isArmed) {
                setArmed(it.label)
                return
              }
              it.onClick()
              onClose()
            }}
            className={`block w-full rounded-[5px] px-2 py-1 text-left text-[13px] hover:bg-surface-sunken ${
              it.danger || isArmed ? 'text-error' : ''
            }`}
          >
            {isArmed ? (it.confirmLabel ?? 'Click again to confirm') : it.label}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
