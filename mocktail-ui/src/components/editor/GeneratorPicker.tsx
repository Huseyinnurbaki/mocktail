import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const FAKER_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Identifiers', types: ['uuid'] },
  { label: 'Person', types: ['firstName', 'lastName', 'fullName'] },
  { label: 'Contact', types: ['email', 'phone', 'username'] },
  { label: 'Internet', types: ['url', 'domain', 'ipv4'] },
  { label: 'Numbers', types: ['number', 'float', 'price'] },
  { label: 'Text', types: ['word', 'sentence', 'paragraph'] },
  { label: 'Dates', types: ['pastDate', 'futureDate'] },
  { label: 'Location', types: ['city', 'country', 'countryCode'] },
  { label: 'Misc', types: ['bool', 'hexColor'] },
]

/** Searchable, grouped generator dropdown; special modes (Custom / AI) set apart in accent. */
export function GeneratorPicker({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (type: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [query, setQuery] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const MENU_W = 210

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: Math.max(8, r.right - MENU_W) })
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
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const isSpecial = value === 'fixed' || value === 'ai'
  const label = !value ? '— keep —' : value === 'fixed' ? 'Custom' : value === 'ai' ? '✨ AI prompt' : value
  const item = 'block w-full rounded-[5px] px-2 py-1 text-left text-[12px] hover:bg-surface-sunken'

  function pick(v: string) {
    onChange(v)
    setOpen(false)
  }

  const q = query.trim().toLowerCase()
  const groups = q
    ? FAKER_GROUPS.map((g) => ({ ...g, types: g.types.filter((t) => t.toLowerCase().includes(q)) })).filter(
        (g) => g.types.length,
      )
    : FAKER_GROUPS

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex items-center gap-1 rounded-[6px] border px-2 py-[3px] text-[12px] ${
          value
            ? isSpecial
              ? 'border-param/50 bg-param/15 text-param'
              : 'border-border bg-accent-tint text-accent-text'
            : 'border-border bg-surface text-muted'
        }`}
      >
        {label} <span className="text-[9px] opacity-70">▼</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
            className="fixed z-50 flex max-h-[340px] flex-col overflow-hidden rounded-[8px] border border-border bg-surface shadow-lg"
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
                placeholder="Search generators…"
                className="w-full rounded-[5px] bg-surface-sunken px-2 py-1 text-[12px] outline-none placeholder:text-muted"
              />
            </div>
            <div className="overflow-auto p-1">
              {!q && (
                <>
                  <button onClick={() => pick('')} className={`${item} ${!value ? 'text-accent-text' : 'text-muted'}`}>
                    — keep —
                  </button>
                  <button onClick={() => pick('fixed')} className={`${item} font-medium text-param`}>
                    Custom (fixed value)
                  </button>
                  <button
                    disabled
                    title="AI generation isn't wired yet — see roadmap"
                    className={`${item} cursor-not-allowed font-medium text-param opacity-50`}
                  >
                    ✨ AI prompt <span className="text-[9px] opacity-70">soon</span>
                  </button>
                  <div className="my-1 border-t border-border-subtle" />
                </>
              )}
              {groups.map((g) => (
                <div key={g.label}>
                  <div className="px-2 pb-[2px] pt-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                    {g.label}
                  </div>
                  {g.types.map((ty) => (
                    <button
                      key={ty}
                      onClick={() => pick(ty)}
                      className={`${item} flex items-center justify-between font-mono ${value === ty ? 'text-accent-text' : ''}`}
                    >
                      <span>{ty}</span>
                      {value === ty && <span>✓</span>}
                    </button>
                  ))}
                </div>
              ))}
              {q && groups.length === 0 && <div className="px-2 py-2 text-[12px] text-muted">No match</div>}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
