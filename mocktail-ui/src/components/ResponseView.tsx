import { useMemo, useState } from 'react'

/** Pretty-print JSON when possible; leave non-JSON as-is. */
function beautify(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

const PREVIEW_LINES = 16

/** Beautified response body, collapsed to `+N more lines` when long. */
export function ResponseView({ body }: { body: string }) {
  const pretty = useMemo(() => beautify(body), [body])
  const [expanded, setExpanded] = useState(false)
  const lines = pretty.split('\n')
  const overflow = lines.length > PREVIEW_LINES
  const shown = !overflow || expanded ? pretty : lines.slice(0, PREVIEW_LINES).join('\n')
  const hidden = lines.length - PREVIEW_LINES

  return (
    <div>
      <pre className="max-h-[360px] overflow-auto rounded-[9px] border border-border bg-surface-sunken p-3 font-mono text-[11.5px] leading-[1.7]">
        {shown || '(empty)'}
        {overflow && !expanded && <span className="text-muted">{`\n… +${hidden} more lines`}</span>}
      </pre>
      {overflow && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[12px] text-accent-text hover:underline"
        >
          {expanded ? 'Show less' : `Show all (${lines.length} lines)`}
        </button>
      )}
    </div>
  )
}
