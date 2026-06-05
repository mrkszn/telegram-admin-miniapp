import { useEffect, useState, type ReactNode } from 'react'
import { readyTelegram } from '@/lib/telegram/sdk'
import { applyTelegramTheme, subscribeTelegramTheme } from '@/lib/telegram/theme'
import { useThemePreference } from '@/lib/hooks/useThemePreference'

interface ThemeProviderProps {
  children: ReactNode
  /**
   * Hard override scheme — screenshots / tests / story playgrounds.
   * Wins over both the user preference and Telegram.
   */
  forceScheme?: 'light' | 'dark'
}

export function ThemeProvider({ children, forceScheme }: ThemeProviderProps) {
  const [ready, setReady] = useState(false)
  const { preference, resolve } = useThemePreference()

  useEffect(() => {
    const tg = readyTelegram()
    const apply = (upstream: 'light' | 'dark' | undefined) => {
      const scheme = forceScheme ?? resolve(upstream)
      applyTelegramTheme(tg?.themeParams, scheme)
    }
    apply(tg?.colorScheme)
    const unsubscribe = subscribeTelegramTheme(tg, (current) => apply(current.colorScheme))
    setReady(true)
    return unsubscribe
    // `resolve` is a useCallback whose identity changes only when the user
    // flips the preference — that's exactly when we want to re-apply.
  }, [forceScheme, resolve])

  return (
    <div data-theme-ready={ready ? 'true' : 'false'} data-theme-pref={preference}>
      {children}
    </div>
  )
}
