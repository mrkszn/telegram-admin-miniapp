/**
 * Active UI language, persisted to localStorage and **shared across all
 * components** via a module-level subscriber store — the same pattern as
 * `useThemePreference`. Using `useSyncExternalStore` means every component
 * that reads the language re-renders the instant it changes, so flipping the
 * language on /settings re-translates the whole tree immediately.
 *
 * localStorage is just a fast-path cache so the UI doesn't flash the default
 * before the backend GET /admin/settings resolves; the backend remains the
 * source of truth and overwrites it on load.
 */
import type { Language } from './translations'

const STORAGE_KEY = 'app-language'
const DEFAULT_LANGUAGE: Language = 'uk'

function isLanguage(v: unknown): v is Language {
  return v === 'uk' || v === 'en'
}

function readStorage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (isLanguage(v)) return v
  } catch {
    /* private mode / sandboxed iframe */
  }
  return DEFAULT_LANGUAGE
}

let current: Language = readStorage()
const listeners = new Set<() => void>()

export function setLanguage(next: Language): void {
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

export function getLanguage(): Language {
  return current
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// SSR-safe snapshot — Vite SPA never SSRs, but useSyncExternalStore wants it.
export function getServerSnapshot(): Language {
  return DEFAULT_LANGUAGE
}
