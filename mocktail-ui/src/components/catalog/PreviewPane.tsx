import type { Mock } from '../../lib/mocks'
import type { TestResult } from '../../lib/api'
import { statusColor } from '../../lib/format'
import { ResponseView } from '../ResponseView'

export function PreviewPane({
  mock,
  onEdit,
  onSend,
  result,
  busy,
  err,
  width,
}: {
  mock: Mock | null
  onEdit: (m: Mock) => void
  onSend: (m: Mock) => void
  result: TestResult | null
  busy: boolean
  err: string | null
  width: number
}) {
  return (
    <aside
      style={{ width }}
      className="hidden shrink-0 flex-col overflow-hidden border-l border-border xl:flex"
    >
      {!mock ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-muted">
          Select a mock to preview
        </div>
      ) : (
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
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {err && <div className="mb-2 text-[12.5px] text-error">{err}</div>}
            {result ? (
              <>
                <div className="mb-2 flex items-center gap-2 font-mono text-[12px]">
                  <span className={`font-semibold ${statusColor(result.status)}`}>{result.status}</span>
                  <span className="text-muted">· {result.ms}ms · live response</span>
                </div>
                <ResponseView body={result.body} />
              </>
            ) : (
              <>
                <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-muted">Response body</div>
                <ResponseView body={mock.body} />
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
