import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { STATUS_GROUPS } from '../../lib/mocks'

const MENU_W = 224

/** Status-code dropdown that always opens downward from the trigger's bottom-left. */
export function StatusPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - MENU_W - 8) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function close() {
      setOpen(false)
    }
    function onScroll(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return // scrolling inside the menu — keep open
      close()
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function pick(v: number) {
    onChange(v)
    setOpen(false)
  }

  const known = STATUS_GROUPS.some((g) => g.codes.some(([c]) => c === value))
  const item = 'flex w-full items-center gap-2 rounded-[5px] px-2 py-1 text-left font-mono text-[12px] hover:bg-surface-sunken'

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex h-[36px] items-center gap-2 rounded-[9px] border border-border px-3"
      >
        <span className="text-[12.5px] text-muted">Status</span>
        <span className="font-mono text-[13px] font-semibold text-accent-text">{value}</span>
        <span className="text-[9px] text-muted">▼</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
            className="fixed z-50 rounded-[9px] border border-border bg-surface p-1 shadow-lg"
          >
            {!known && (
              <button onClick={() => pick(value)} className={`${item} text-accent-text`}>
                <span className="w-[34px]">{value}</span>
                <span>custom</span>
                <span className="ml-auto">✓</span>
              </button>
            )}
            {STATUS_GROUPS.map((g) => (
              <div key={g.label}>
                <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                  {g.label}
                </div>
                {g.codes.map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => pick(code)}
                    className={`${item} ${value === code ? 'text-accent-text' : ''}`}
                  >
                    <span className="w-[34px]">{code}</span>
                    <span className={value === code ? '' : 'text-muted'}>{name}</span>
                    {value === code && <span className="ml-auto">✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
