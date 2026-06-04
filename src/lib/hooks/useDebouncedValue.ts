import { useEffect, useState } from 'react'

/**
 * Returns the latest value once it has settled for `delay` ms.
 * Used to throttle search-input → backend round-trips.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
