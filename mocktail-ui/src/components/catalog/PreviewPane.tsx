import type { Mock } from '../../lib/mocks'
import type { TestResult } from '../../lib/api'
import { beautify, statusColor } from '../../lib/format'
import { CodeEditor } from '../CodeEditor'

/** Preview-tab content of the right panel (no frame — RightPanel owns the aside). */
export function PreviewContent({
  mock,
  onEdit,
  onSend,
  result,
  busy,
  err,
}: {
  mock: Mock | null
  onEdit: (m: Mock) => void
  onSend: (m: Mock) => void
  result: TestResult | null
  busy: boolean
  err: string | null
}) {
  if (!mock) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-muted">
        Select a mock to preview
      </div>
    )
  }

  // Before sending: the mock's configured custom headers. After sending: the actually-served headers.
  const headerEntries: [string, string][] = result ? result.headers : Object.entries(mock.headers)

  return (
    <>
      <div className="flex gap-2 border-b border-border p-3">
        <button
          onClick={() => onSend(mock)}
          disabled={busy}
          className="h-[32px] flex-1 rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
        >
          {busy ? 'Sending…' : '▶ Send request'}
        </button>
        <button
          onClick={() => onEdit(mock)}
          className="h-[32px] rounded-[8px] border border-border px-3 text-[13px] hover:bg-surface-sunken"
        >
          Edit
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {err && <div className="border-b border-border bg-del-bg px-3 py-2 text-[12.5px] text-del-fg">{err}</div>}
        <div className="border-b border-border px-3 py-2 font-mono text-[11.5px]">
          {result ? (
            <span className="flex items-center gap-2">
              <span className={`font-semibold ${statusColor(result.status)}`}>{result.status}</span>
              <span className="text-muted">· {result.ms}ms · live response</span>
            </span>
          ) : (
            <span className="uppercase tracking-[0.06em] text-muted">Response body</span>
          )}
        </div>
        {headerEntries.length > 0 && (
          <div className="border-b border-border px-3 py-2">
            <div className="mb-1 text-[10px] uppercase tracking-[0.06em] text-muted">
              {result ? 'Response headers' : 'Custom headers'}
            </div>
            <div className="flex max-h-[110px] flex-col gap-[2px] overflow-auto font-mono text-[11px]">
              {headerEntries.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="shrink-0 text-muted">{k}:</span>
                  <span className="min-w-0 break-all">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <CodeEditor value={beautify(result ? result.body : mock.body)} onChange={() => {}} readOnly />
        </div>
      </div>
    </>
  )
}
