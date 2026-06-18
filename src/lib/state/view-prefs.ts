/**
 * Last visited bottom-nav tab, persisted so re-opening the Mini App (or hitting
 * the root route after a restart) lands the user back where they were instead
 * of always bouncing to /dashboard.
 *
 * Plain localStorage helpers (no React) — BottomNav records the active path and
 * RootRoute reads it on bootstrap. Shares the `mini_app.ui.*` namespace used by
 * usePersistentState.
 */

const LAST_TAB_KEY = 'mini_app.ui.last_tab'

/** Paths eligible to be remembered as the entry tab. */
const KNOWN_TABS = new Set(['/dashboard', '/metrics', '/topics', '/clients', '/ask'])

export function rememberLastTab(path: string): void {
  if (!KNOWN_TABS.has(path)) return
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_TAB_KEY, path)
  } catch {
    /* private mode / quota */
  }
}

/** The remembered tab, or `/dashboard` when absent or invalid. */
export function readLastTab(): string {
  if (typeof window === 'undefined') return '/dashboard'
  try {
    const v = window.localStorage.getItem(LAST_TAB_KEY)
    if (v && KNOWN_TABS.has(v)) return v
  } catch {
    /* swallow */
  }
  return '/dashboard'
}
