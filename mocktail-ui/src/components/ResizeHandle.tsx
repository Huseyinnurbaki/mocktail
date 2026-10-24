/**
 * Drag handle on the left edge of a right-docked panel (pair with useResizable). It takes 1px of
 * layout — the divider line — but has an 11px hit area overlapping both sides, a visible grip,
 * and highlights on hover/drag. Double-click resets the width; ←/→ resize when focused.
 */
export function ResizeHandle({
  onPointerDown,
  nudge,
  reset,
  className = '',
}: {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
  nudge: (delta: number) => void
  reset: () => void
  className?: string
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={onPointerDown}
      onDoubleClick={reset}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 64 : 16
        if (e.key === 'ArrowLeft') nudge(step) // handle moves left → panel grows
        else if (e.key === 'ArrowRight') nudge(-step)
        else return
        e.preventDefault()
      }}
      className={`group relative z-10 -mx-[5px] w-[11px] shrink-0 cursor-col-resize touch-none select-none focus:outline-none ${className}`}
    >
      {/* divider line — thickens and turns accent on hover / drag / keyboard focus */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-[width,background-color] group-hover:w-[3px] group-hover:bg-accent group-focus-visible:w-[3px] group-focus-visible:bg-accent group-active:w-[3px] group-active:bg-accent" />
      {/* grip */}
      <div className="absolute left-1/2 top-1/2 flex h-10 w-[9px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[3px] rounded-full border border-border bg-surface shadow-sm transition-colors group-hover:border-accent group-active:border-accent">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[3px] w-[3px] rounded-full bg-muted group-hover:bg-accent group-active:bg-accent" />
        ))}
      </div>
    </div>
  )
}
