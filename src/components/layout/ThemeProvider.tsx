import { useEffect, useState, type ReactNode } from 'react'
import { readyTelegram } from '@/lib/telegram/sdk'
import { applyTelegramTheme, subscribeTelegramTheme } from '@/lib/telegram/theme'

interface ThemeProviderProps {
  children: ReactNode
  /** Force a colour scheme regardless of Telegram. Useful for screenshots/tests. */
  forceScheme?: 'light' | 'dark'
}

export function ThemeProvider({ children, forceScheme }: ThemeProviderProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const tg = readyTelegram()
    applyTelegramTheme(tg?.themeParams, forceScheme ?? tg?.colorScheme ?? 'light')
    const unsubscribe = subscribeTelegramTheme(tg, (current) => {
      applyTelegramTheme(current.themeParams, forceScheme ?? current.colorScheme)
    })
    setReady(true)
    return unsubscribe
  }, [forceScheme])

  // Render children immediately — theme application is cheap and idempotent.
  // The `ready` flag is exposed via data-attr for tests / debugging.
  return <div data-theme-ready={ready ? 'true' : 'false'}>{children}</div>
}
