import { useState } from 'react'
import { type TestResult } from '../../lib/api'
import { statusColor } from '../../lib/format'
import { ResponseView } from '../ResponseView'

type Outcome = { result?: TestResult; note?: string; error?: string }

export function TestTab({
  isNew,
  method,
  path,
  onRun,
}: {
  isNew: boolean
  method: string
  path: string
  onRun: () => Promise<Outcome>
}) {
  const [outcome, setOutcome] = useState<Outcome>({})
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function go() {
    setBusy(true)
    setOutcome(await onRun())
    setBusy(false)
  }

  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(`curl -X ${method} 'http://localhost:4000/mocktail${path}'`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  const { result, note, error } = outcome

  return (
    <div>
      <button
        onClick={() => void go()}
        disabled={busy}
        className="h-[32px] w-full rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
      >
        {busy ? 'Sending…' : isNew ? '▶ Save & send' : '▶ Send request'}
      </button>
      {isNew && (
        <div className="mt-2 text-[12px] text-muted">Saves the mock first, then sends the request.</div>
      )}

      {error && <div className="mt-3 text-[12.5px] text-error">{error}</div>}
      {note && (
        <div className="mt-3 rounded-[8px] border border-warning/40 bg-put-bg px-3 py-2 text-[12px] text-put-fg">
          {note}
        </div>
      )}
      {result && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between font-mono text-[12px]">
            <span>
              <span className={statusColor(result.status)}>{result.status}</span> · {result.ms}ms
            </span>
            <button onClick={() => void copyCurl()} className="text-[11.5px] text-accent-text hover:underline">
              {copied ? 'Copied ✓' : 'Copy cURL'}
            </button>
          </div>
          <ResponseView body={result.body} />
        </div>
      )}
    </div>
  )
}
