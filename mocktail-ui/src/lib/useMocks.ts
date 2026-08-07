import { useCallback, useEffect, useState } from 'react'
import { fetchMocks } from './api'
import type { Mock } from './mocks'

export interface MocksState {
  mocks: Mock[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/** Loads mocks from the backend on mount; `reload()` refetches (e.g. after a save). */
export function useMocks(): MocksState {
  const [mocks, setMocks] = useState<Mock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const next = await fetchMocks()
      setMocks(next)
      setError(null)
    } catch (e: unknown) {
      setMocks([])
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { mocks, loading, error, reload }
}
