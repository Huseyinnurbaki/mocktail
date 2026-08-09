import { useState } from 'react'
import type { Method } from '../../lib/mocks'
import { sendMock, type TestResult } from '../../lib/api'
import { statusColor } from '../../lib/format'
import { ResponseView } from '../ResponseView'

export function TestTab({ method, path }: { method: Method; path: string }) {
  const [result, setResult] = useState<TestResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setErr(null)
    try {
      setResult(await sendMock(method, path))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => void send()}
        disabled={busy}
        className="h-[32px] w-full rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
      >
        {busy ? 'Sending…' : '▶ Send request'}
      </button>
      <div className="mt-2 text-[12px] text-muted">Save the mock first so the endpoint exists.</div>
      {err && <div className="mt-3 text-[12.5px] text-error">{err}</div>}
      {result && (
        <div className="mt-3">
          <div className="mb-1 font-mono text-[12px]">
            <span className={statusColor(result.status)}>{result.status}</span> · {result.ms}ms
          </div>
          <ResponseView body={result.body} />
        </div>
      )}
    </div>
  )
}
