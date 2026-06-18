import { useEffect } from 'react'
import { fetchSettings } from '@/lib/api/admin'
import { useSessionStore } from '@/lib/state/session-store'
import { setLanguage } from './index'

/**
 * Pulls the saved UI language from the backend once the session token is
 * available and applies it app-wide. Renders nothing.
 *
 * localStorage already gave us a fast-path default before this resolves;
 * the GET here makes the backend the source of truth, so the chosen
 * language survives a reload even on a fresh device.
 */
export function LanguageSync() {
  const token = useSessionStore((s) => s.token)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void fetchSettings()
      .then((settings) => {
        if (!cancelled) setLanguage(settings.language)
      })
      .catch(() => {
        // Non-fatal — fall back to the localStorage / default language.
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return null
}
