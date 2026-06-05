import { useCallback, useSyncExternalStore } from 'react'

/**
 * 3-state theme preference, persisted to localStorage, **shared across all
 * components** via a module-level subscriber store.
 *
 *  - 'auto'  → follow Telegram colorScheme (or system on web)
 *  - 'light' → force light
 *  - 'dark'  → force dark
 *
 * Previous version used `useState` inside the hook, which means every
 * caller got an independent copy — ThemeToggle's `cycle()` updated its own
 * copy but ThemeProvider's copy never noticed, so flipping the icon did
 * nothing visible. `useSyncExternalStore` + a shared listener set fixes
 * this without pulling in a context provider.
 */

export type ThemePreference = 'auto' | 'light' | 'dark'
export type EffectiveScheme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

/* ── module-level shared store ──────────────────────────── */

function readStorage(): ThemePreference {
  if (typeof window === 'undefined') return 'auto'
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'auto') return v
  } catch {
    /* private mode / sandboxed iframe */
  }
  return 'auto'
}

let current: ThemePreference = readStorage()
const listeners = new Set<() => void>()

function setPreferenceShared(next: ThemePreference): void {
  if (next === current) return
  current = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* swallow */
    }
  }
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): ThemePreference {
  return current
}

// SSR-safe snapshot — Vite SPA never SSRs, but useSyncExternalStore wants it.
function getServerSnapshot(): ThemePreference {
  return 'auto'
}

/* ── hook ───────────────────────────────────────────────── */

interface UseThemePreferenceResult {
  preference: ThemePreference
  cycle: () => void
  setPreference: (next: ThemePreference) => void
  /**
   * Effective scheme to apply right now. Pass the Telegram-reported scheme
   * (or any upstream fallback) to resolve 'auto'.
   */
  resolve: (upstream: EffectiveScheme | undefined) => EffectiveScheme
}

export function useThemePreference(): UseThemePreferenceResult {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceShared(next)
  }, [])

  const cycle = useCallback(() => {
    const next: ThemePreference =
      current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto'
    setPreferenceShared(next)
  }, [])

  const resolve = useCallback(
    (upstream: EffectiveScheme | undefined): EffectiveScheme => {
      if (preference === 'light' || preference === 'dark') return preference
      return upstream ?? 'light'
    },
    [preference],
  )

  return { preference, cycle, setPreference, resolve }
}
