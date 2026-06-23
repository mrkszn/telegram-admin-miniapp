import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { isWarmRestart, markSessionOpen, readLastTab } from '@/lib/state/view-prefs'
import { ChatRoute } from './chat'

/**
 * Landing-route arbiter. The redesign hard-wires `/` to chat, but a power
 * user who was deep in /metrics yesterday and just had the WebView soft-
 * reload would rather pop back there than start from the chat. We split
 * cold vs warm via a sessionStorage marker (see lib/state/view-prefs):
 *
 *  - Fresh WebView (no session marker) → render ChatRoute as the landing.
 *  - Warm restart (marker present + a remembered tab exists) → Navigate to
 *    that tab so the user resumes where they left off.
 *
 * The decision is memoised (no `useState`) — `useMemo` runs once per mount
 * and the Navigate is replace-style so the redirect doesn't pollute the
 * history stack.
 */
export function LandingRouter() {
  const target = useMemo(() => {
    const warm = isWarmRestart()
    const last = readLastTab()
    // First landing in this WebView session — mark it open BEFORE returning
    // so any subsequent mount in the same session reads as warm.
    if (!warm) {
      markSessionOpen()
      return null
    }
    return last
  }, [])

  if (target) return <Navigate to={target} replace />
  return <ChatRoute />
}
