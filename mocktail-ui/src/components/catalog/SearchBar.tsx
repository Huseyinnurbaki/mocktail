import type { RefObject } from 'react'
import { MOD } from '../../lib/platform'

/** Catalog search row: inline path completion (ghost tail + Tab to accept), count, and export. */
export function SearchBar({
  query,
  onChange,
  ghost,
  count,
  onExport,
  exportDisabled,
  inputRef,
}: {
  query: string
  onChange: (q: string) => void
  ghost: string
  count: number
  onExport: () => void
  exportDisabled: boolean
  inputRef: RefObject<HTMLInputElement>
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-[18px] py-3">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="shrink-0 text-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
      </svg>
      {/* A dimmed ghost tail suggests the next base-path segment; Tab accepts it. An invisible copy
          of the typed text reserves width so the ghost lines up right after the caret. */}
      <div className="relative flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-[13px]"
        >
          <span className="invisible">{query}</span>
          <span className="text-muted/50">{ghost}</span>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && ghost) {
              e.preventDefault()
              onChange(query + ghost)
            } else if (e.key === 'Escape') {
              onChange('')
              e.currentTarget.blur()
            }
          }}
          placeholder="Search endpoints — type a path, ⇥ to complete"
          className="relative w-full bg-transparent text-[13px] outline-none placeholder:text-muted"
        />
      </div>
      <span className="whitespace-nowrap text-[12px] text-muted">{count} endpoints</span>
      <kbd className="shrink-0 rounded-[4px] border border-border px-[4px] py-[1px] font-mono text-[10px] text-muted">
        {MOD}F
      </kbd>
      <button
        onClick={onExport}
        disabled={exportDisabled}
        title={`Export ${count} mock${count === 1 ? '' : 's'}${query.trim() ? ' matching search' : ''} as JSON`}
        aria-label="Export mocks"
        className="shrink-0 text-muted hover:text-fg disabled:opacity-40"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  )
}
