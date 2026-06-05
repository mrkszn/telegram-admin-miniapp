import { useCallback, useEffect, useState } from 'react'

/**
 * 3-state theme preference, persisted to localStorage:
 *  - 'auto'  → follow Telegram colorScheme (or system on web)
 *  - 'light' → force light, ignore Telegram
 *  - 'dark'  → force dark, ignore Telegram
 *
 * Returns the current preference + setter + the **effective** scheme
 * (resolved against the Telegram-supplied colorScheme).
 */

export type ThemePreference = 'auto' | 'light' | 'dark'
export type EffectiveScheme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

function readStorage(): ThemePreference {
  if (typeof window === 'undefined') return 'auto'
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'auto') return v
  } catch {
    /* localStorage may be blocked (private mode, sandboxed iframe) */
  }
  return 'auto'
}

function writeStorage(value: ThemePreference): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* swallow */
  }
}

interface UseThemePreferenceResult {
  /** What the user picked. */
  preference: ThemePreference
  /** Cycle auto → light → dark → auto. */
  cycle: () => void
  /** Set an explicit value. */
  setPreference: (next: ThemePreference) => void
  /**
   * Effective scheme to apply right now. Pass the Telegram-reported scheme
   * (or whatever upstream fallback you have) to resolve 'auto'.
   */
  resolve: (upstream: EffectiveScheme | undefined) => EffectiveScheme
}

export function useThemePreference(): UseThemePreferenceResult {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStorage())

  useEffect(() => {
    writeStorage(preference)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
  }, [])

  const cycle = useCallback(() => {
    setPreferenceState((curr) =>
      curr === 'auto' ? 'light' : curr === 'light' ? 'dark' : 'auto',
    )
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
