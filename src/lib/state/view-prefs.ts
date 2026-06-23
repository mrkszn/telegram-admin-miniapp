/**
 * Cold-vs-warm landing memory. The redesign hard-wires `/` to ChatRoute, but
 * power users (analysts living in /metrics or /dashboard) need their last
 * visited screen back on relaunch. We split the two cases:
 *
 *  - Cold start (WebView killed → sessionStorage gone) → land on chat.
 *  - Warm restart (background return, or a soft WebView reload in the same
 *    session → sessionStorage survives) → redirect to the last visited tab.
 *
 * `markSessionOpen()` is called once per WebView lifetime, on the FIRST
 * landing render. `rememberLastTab()` writes to localStorage on every nav.
 * `isWarmRestart()` checks the session marker — if it's already there when
 * the landing mounts, we know this isn't the first render of a fresh WebView.
 */

const SESSION_MARKER = 'mini_app.session.open'
const LAST_TAB_KEY = 'mini_app.ui.last_tab'

/** Paths eligible to be remembered as the entry tab. Chat (`/`) deliberately
 *  excluded — it's already the cold-start landing, so storing it would
 *  defeat the cold→chat invariant. */
const KNOWN_TABS = new Set<string>([
  '/dashboard',
  '/metrics',
  '/topics',
  '/clients',
  '/prizes',
  '/settings',
])

export function rememberLastTab(path: string): void {
  if (!KNOWN_TABS.has(path)) return
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_TAB_KEY, path)
  } catch {
    /* private mode / quota */
  }
}

/** The remembered tab, or null when none. */
export function readLastTab(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(LAST_TAB_KEY)
    if (v && KNOWN_TABS.has(v)) return v
  } catch {
    /* swallow */
  }
  return null
}

export function markSessionOpen(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_MARKER, '1')
  } catch {
    /* swallow */
  }
}

/** True iff the session marker is already present — i.e. this is NOT the
 *  first landing render of a fresh WebView. */
export function isWarmRestart(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(SESSION_MARKER) === '1'
  } catch {
    return false
  }
}
