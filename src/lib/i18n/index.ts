/**
 * Public i18n surface.
 *
 *   const t = useT()
 *   t('common.retry')                       // → "Повторити" / "Retry"
 *   t('metrics.notFound', { label: 'NPS' }) // interpolated entry
 *
 * `useT()` subscribes to the shared language store, so any component that
 * calls it re-renders when the language changes.
 */
import { useCallback, useSyncExternalStore } from 'react'
import {
  translations,
  type Language,
  type TranslationKey,
  type TranslationParams,
} from './translations'
import { getLanguage, getServerSnapshot, subscribe } from './store'

export type { Language, TranslationKey } from './translations'
export { setLanguage, getLanguage } from './store'

/** Reactive accessor for the current language. */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, getServerSnapshot)
}

/** Resolve a key against an explicit language (non-reactive). */
export function translate(
  lang: Language,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const entry = translations[lang][key] ?? translations.uk[key]
  return typeof entry === 'function' ? entry(params ?? {}) : entry
}

export type Translator = (key: TranslationKey, params?: TranslationParams) => string

/** Hook returning a translator bound to the current language. */
export function useT(): Translator {
  const lang = useLanguage()
  return useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(lang, key, params),
    [lang],
  )
}

/* ── locale-aware Intl helpers ──────────────────────────── */

const NUMBER_LOCALE: Record<Language, string> = { uk: 'uk-UA', en: 'en-US' }
const DATE_LOCALE: Record<Language, string> = { uk: 'uk-UA', en: 'en-US' }

export function numberLocale(lang: Language): string {
  return NUMBER_LOCALE[lang]
}

export function dateLocale(lang: Language): string {
  return DATE_LOCALE[lang]
}
