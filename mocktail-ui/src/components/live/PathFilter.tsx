import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toggleIn } from '../../lib/live'

/** Searchable multi-select dropdown of the paths currently seen in traffic. */
export function PathFilter({
  wild,
  exact,
  selected,
  onChange,
}: {
  wild: string[]
  exact: string[]
  selected: Set<string>
  onChange: (s: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [query, setQuery] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const MENU_W = 300

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - MENU_W - 8) })
    setQuery('')
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

  const q = query.trim().toLowerCase()
  const fWild = q ? wild.filter((p) => p.toLowerCase().includes(q)) : wild
  const fExact = q ? exact.filter((p) => p.toLowerCase().includes(q)) : exact
  const label = selected.size === 0 ? 'All paths' : selected.size === 1 ? [...selected][0] : `${selected.size} paths`

  const opt = (p: string) => (
    <button
      key={p}
      onClick={() => onChange(toggleIn(selected, p))}
      className={`flex w-full items-center gap-2 rounded-[5px] px-2 py-1 text-left font-mono text-[12px] hover:bg-surface-sunken ${
        selected.has(p) ? 'text-accent-text' : ''
      }`}
    >
      <span className="flex-1 truncate">{p}</span>
      {selected.has(p) && <span>✓</span>}
    </button>
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex h-[26px] min-w-[140px] max-w-[260px] items-center gap-1 rounded-[7px] border px-2 text-[12px] ${
          selected.size
            ? 'border-accent bg-accent-tint text-accent-text'
            : 'border-border text-muted hover:bg-surface-sunken'
        }`}
      >
        <span className="flex-1 truncate text-left font-mono">{label}</span>
        <span className="text-[9px] opacity-70">▼</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
            className="fixed z-50 flex max-h-[320px] flex-col overflow-hidden rounded-[9px] border border-border bg-surface shadow-lg"
          >
            <div className="border-b border-border-subtle p-1">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation()
                    setOpen(false)
                  }
                }}
                placeholder="Search paths…"
                className="w-full rounded-[5px] bg-surface-sunken px-2 py-1 text-[12px] outline-none placeholder:text-muted"
              />
            </div>
            <div className="overflow-auto p-1">
              {selected.size > 0 && (
                <button
                  onClick={() => onChange(new Set())}
                  className="mb-1 block w-full rounded-[5px] px-2 py-1 text-left text-[12px] text-accent-text hover:bg-surface-sunken"
                >
                  Clear selection
                </button>
              )}
              {fWild.length === 0 && fExact.length === 0 ? (
                <div className="px-2 py-2 text-[12px] text-muted">No paths</div>
              ) : (
                <>
                  {fWild.length > 0 && (
                    <>
                      <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                        Prefixes
                      </div>
                      {fWild.map(opt)}
                    </>
                  )}
                  {fExact.length > 0 && (
                    <>
                      <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                        Paths
                      </div>
                      {fExact.map(opt)}
                    </>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
