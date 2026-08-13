import { useEffect, useRef, useState } from 'react'
import { clearLogs, fetchLogs, type LogEntry } from '../lib/api'
import { errText } from '../lib/err'

/** Polls the backend log buffer every 1.5s (pausable) and exposes clearing the buffer. */
export function useLiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    let alive = true
    async function poll() {
      if (pausedRef.current) return
      try {
        const l = await fetchLogs()
        if (alive) {
          setLogs(l)
          setError(null)
        }
      } catch (e) {
        if (alive) setError(errText(e))
      }
    }
    void poll()
    const id = setInterval(poll, 1500)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  async function clear() {
    await clearLogs()
    setLogs([])
  }

  return { logs, error, paused, setPaused, clear }
}
