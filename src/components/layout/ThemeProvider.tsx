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
      // Auto = follow Telegram → let it override our tokens.
      // Forced light/dark = ignore Telegram colours → pure tokens.css scheme.
      const overrideTokens = preference === 'auto' && !forceScheme
      applyTelegramTheme(tg?.themeParams, scheme, { overrideTokens })
    }
    apply(tg?.colorScheme)
    const unsubscribe = subscribeTelegramTheme(tg, (current) => apply(current.colorScheme))
    setReady(true)
    return unsubscribe
    // `resolve` identity follows the preference; we also depend on
    // `preference` directly so the override-flag re-evaluates.
  }, [forceScheme, preference, resolve])

  return (
    <div data-theme-ready={ready ? 'true' : 'false'} data-theme-pref={preference}>
      {children}
    </div>
  )
}
