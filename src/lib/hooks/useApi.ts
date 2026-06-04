import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError } from '@/lib/api/types'
import { toApiError } from '@/lib/api/client'

export interface UseApiResult<T> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
  refetch(): Promise<void>
}

/**
 * Minimal fetcher hook — no caching, no dedup, no retry. Intentionally
 * tiny: an instance can add SWR / React Query / TanStack Query on top.
 *
 * `key` is the cache key; a change re-fetches. Pass a stable string per
 * logical request (e.g. `["overview", from, to].join("|")`).
 */
export function useApi<T>(key: string, fetcher: () => Promise<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
    } catch (err) {
      setError(toApiError(err))
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void run()
  }, [key, run])

  return { data, error, isLoading, refetch: run }
}
