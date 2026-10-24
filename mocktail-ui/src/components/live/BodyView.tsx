import { useMemo, useState } from 'react'
import { formatBytes, formatForView } from '../../lib/format'
import { CodeEditor } from '../CodeEditor'

/**
 * A logged request or response body: read-only editor, with a note when the log truncated it or
 * it's too large to pretty-print by default. Mount with a `key` per entry+side so the Format
 * choice resets between bodies.
 */
export function BodyView({
  text,
  size,
  truncated,
  fullBodyNote,
  empty,
}: {
  text: string
  size: number
  truncated: boolean
  /** Who still got the whole body, e.g. "the client got the full body". */
  fullBodyNote: string
  /** Placeholder when there's no body at all. */
  empty: string
}) {
  const [forcePretty, setForcePretty] = useState(false)
  // Formatting a large body is real main-thread work — once per body, not every poll.
  const body = useMemo(() => formatForView(text, forcePretty), [text, forcePretty])

  if (size === 0) {
    return <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-muted">{empty}</div>
  }

  return (
    <>
      {(truncated || body.raw) && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2 text-[11.5px] text-muted">
          <span className="min-w-0 flex-1">
            {truncated ? (
              <>
                Log shows the first {formatBytes(text.length)} of {formatBytes(size)} — {fullBodyNote}. Raise{' '}
                <code className="font-mono text-fg">MOCKTAIL_LOG_BODY_KB</code> to keep more.
              </>
            ) : (
              `Large body (${formatBytes(size)}) — shown unformatted`
            )}
          </span>
          {body.raw && (
            <button onClick={() => setForcePretty(true)} className="shrink-0 text-accent-text hover:underline">
              Format
            </button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeEditor value={body.text} onChange={() => {}} readOnly />
      </div>
    </>
  )
}
