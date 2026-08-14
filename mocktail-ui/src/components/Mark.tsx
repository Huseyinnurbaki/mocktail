/** Mocktail mark — ten wedges 36° apart, in currentColor (inherits theme). */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
      <g>
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d="M24 24 19.40 5.56A19 19 0 0 1 28.60 5.56Z"
            transform={`rotate(${i * 36} 24 24)`}
          />
        ))}
      </g>
    </svg>
  )
}
