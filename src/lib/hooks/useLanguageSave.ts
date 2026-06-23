import { useCallback, useState } from 'react'
import { setLanguage, useLanguage } from '@/lib/i18n'
import { updateSettings } from '@/lib/api/admin'
import type { ApiError, SettingsLanguage } from '@/lib/api/types'

interface UseLanguageSaveResult {
  /** Current resolved language, follows the global i18n store. */
  language: SettingsLanguage
  /** True while the PUT is in flight. */
  saving: boolean
  /** Last save error (cleared on next successful save). */
  error: ApiError | null
  /** Optimistically flip locale, PUT, roll back on failure. */
  save(next: SettingsLanguage): Promise<void>
}

/**
 * Shared language-persistence flow used by both `/settings` and the drawer
 * footer chip. Optimistically flips the local i18n store, fires the PUT,
 * rolls back on failure. Without this hook, the drawer's "uk↔en" toggle
 * only mutates memory and gets overwritten on the next LanguageSync hydrate.
 */
export function useLanguageSave(): UseLanguageSaveResult {
  const language = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const save = useCallback(
    async (next: SettingsLanguage) => {
      const previous = language
      if (next === previous) return
      setLanguage(next)
      setSaving(true)
      setError(null)
      try {
        const fresh = await updateSettings({ language: next })
        setLanguage(fresh.language)
      } catch (err) {
        setLanguage(previous)
        setError(err as ApiError)
      } finally {
        setSaving(false)
      }
    },
    [language],
  )

  return { language, saving, error, save }
}
