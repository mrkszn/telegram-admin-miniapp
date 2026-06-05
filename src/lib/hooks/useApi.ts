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
 * logical request (e.g. `["overview", from, to].join("|")`). Pass `null`
 * for either `key` or `fetcher` to **suspend** the call — the hook stays
 * in `isLoading=true`, `data/error=null`, and never executes. Useful when
 * the caller depends on a value that isn't ready yet (e.g. waiting for
 * the metric-key list from /admin/questions).
 */
export function useApi<T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async () => {
    const fn = fetcherRef.current
    if (!fn) {
      // Suspended — keep loading state, no error, no data.
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result)
    } catch (err) {
      setError(toApiError(err))
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (key === null || fetcher === null) {
      // Reset to a suspended state — don't keep stale data around either.
      setData(null)
      setError(null)
      setIsLoading(true)
      return
    }
    void run()
    // fetcher identity changes every render, so we only re-fire on key
    // changes (matches the original behaviour of cache-keyed fetch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, error, isLoading, refetch: run }
}
