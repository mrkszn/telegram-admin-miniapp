import { useCallback, useState } from 'react'

/**
 * `useState` whose value survives navigation, tab switches and a full Mini App
 * restart by mirroring into localStorage under the `mini_app.ui.*` namespace.
 *
 * View preferences only (selected period, picked metric, chart type, topic
 * filters, …). Theme and language are NOT stored here — they persist through
 * the backend `/admin/settings` API (see useThemePreference / i18n store).
 *
 * Each screen reads the stored value on mount, so navigating away and back
 * rehydrates the last choice. An optional `validate` guards against stale
 * values (e.g. a metric key the backend no longer serves).
 */

const NAMESPACE = 'mini_app.ui.'

function storageKey(key: string): string {
  return NAMESPACE + key
}

function read<T>(key: string, fallback: T, validate?: (v: unknown) => boolean): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(storageKey(key))
    if (raw == null) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (validate && !validate(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function usePersistentState<T>(
  key: string,
  fallback: T,
  validate?: (v: unknown) => boolean,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, validate))

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(storageKey(key), JSON.stringify(resolved))
          } catch {
            /* private mode / quota — keep the in-memory value */
          }
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
