import { useEffect, useState } from 'react'
import { sendMock, type TestResult } from '../lib/api'
import type { Mock } from '../lib/mocks'

/** Fire a mock and hold its result; clears when `selectedId` changes. */
export function useSend(selectedId: number | null) {
  const [result, setResult] = useState<TestResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setResult(null)
    setErr(null)
  }, [selectedId])

  async function run(mock: Mock) {
    setBusy(true)
    setErr(null)
    try {
      setResult(await sendMock(mock.method, mock.path))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return { result, busy, err, run }
}
