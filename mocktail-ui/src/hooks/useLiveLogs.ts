import { useEffect, useRef, useState } from 'react'
import { clearLogs, fetchLogEntry, fetchLogs, type LogEntry } from '../lib/api'
import { errText } from '../lib/err'
import { mergeLogs } from '../lib/live'

/** Summaries kept client-side (and the most one poll asks for); the server may hold far more. */
export const MAX_LOGS = 5000

/**
 * Polls the backend log buffer every 1.5s (pausable) and exposes clearing the buffer. Polls are
 * incremental — only summaries newer than the last seen ID — so an idle stream costs a few bytes
 * and bodies are never polled (see useLogEntry).
 */
export function useLiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const cursor = useRef({ epoch: '', after: 0 })

  useEffect(() => {
    let alive = true
    let busy = false // a slow poll must not overlap the next tick
    async function poll() {
      if (pausedRef.current || busy) return
      busy = true
      try {
        let page = await fetchLogs(cursor.current.after, MAX_LOGS)
        // First poll, or the server restarted (its IDs restart too) — start over from scratch.
        const reset = page.epoch !== cursor.current.epoch
        if (reset && cursor.current.after > 0) page = await fetchLogs(0, MAX_LOGS)
        if (!alive) return
        const last = page.logs[page.logs.length - 1]
        cursor.current = { epoch: page.epoch, after: last ? last.id : reset ? 0 : cursor.current.after }
        setLogs((prev) => mergeLogs(reset ? [] : prev, page.logs, page.firstId, MAX_LOGS))
        setError(null)
      } catch (e) {
        if (alive) setError(errText(e))
      } finally {
        busy = false
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

/**
 * The full entry (body + headers) for the selected row, fetched once per selection — entries
 * never change after they're logged. `entry` is null while loading or once the server has
 * evicted it (`evicted`).
 */
export function useLogEntry(id: number | null) {
  const [state, setState] = useState<{ id: number | null; entry: LogEntry | null; evicted: boolean; error: string | null }>(
    { id: null, entry: null, evicted: false, error: null },
  )

  useEffect(() => {
    if (id == null) return
    let alive = true
    setState({ id, entry: null, evicted: false, error: null })
    fetchLogEntry(id)
      .then((entry) => alive && setState({ id, entry, evicted: entry == null, error: null }))
      .catch((e) => alive && setState({ id, entry: null, evicted: false, error: errText(e) }))
    return () => {
      alive = false
    }
  }, [id])

  // Never hand back the previous selection's body while the new one loads.
  return state.id === id ? state : { id, entry: null, evicted: false, error: null }
}
