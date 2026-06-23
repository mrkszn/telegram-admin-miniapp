import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Back-navigation hook that falls back to a known route when the history
 * stack is empty (cold-open / deep-link entry). Without this guard,
 * `navigate(-1)` silently no-ops on `history.length === 1`, and routes
 * that suppress the drawer hamburger (because they set `onBack`) leave
 * the user with no way out.
 */
export function useFallbackBack(fallback = '/'): () => void {
  const navigate = useNavigate()
  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback, { replace: true })
    }
  }, [navigate, fallback])
}
