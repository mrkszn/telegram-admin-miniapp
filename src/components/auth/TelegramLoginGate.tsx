import { useCallback, useEffect, useRef, useState } from 'react'
import { BrandMark } from '@/components/brand/BrandMark'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { useT } from '@/lib/i18n'
import { useAuth } from '@/lib/hooks/useAuth'
import type { TelegramWidgetPayload } from '@/lib/telegram/auth'

/**
 * Where the Telegram Login Widget hangs its JS callback. The widget calls
 * `window[name](user)` when the user authorises in the popup. We use a
 * static name and clean it up on unmount.
 */
const CALLBACK_NAME = 'onTelegramAuth' as const

const WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22'

declare global {
  interface Window {
    [CALLBACK_NAME]?: (user: TelegramWidgetPayload) => void
  }
}

/**
 * Full-screen login gate shown when the page is opened outside Telegram.
 * Renders the official Telegram Login Widget; on success, hands the payload
 * to `useAuth().signInWithTelegramWidget`.
 *
 * Requires `VITE_TELEGRAM_BOT_NAME` in the environment AND the same host to
 * be registered via `@BotFather → /setdomain` — without that the widget
 * silently renders nothing.
 */
export function TelegramLoginGate() {
  const t = useT()
  const { signInWithTelegramWidget, isBootstrapping, error } = useAuth()
  const widgetSlotRef = useRef<HTMLDivElement | null>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const botName = (import.meta.env.VITE_TELEGRAM_BOT_NAME ?? '').trim()

  const handleAuth = useCallback(
    (user: TelegramWidgetPayload) => {
      void signInWithTelegramWidget(user).catch(() => {
        // store recorded the error; UI re-renders from useAuth().error
      })
    },
    [signInWithTelegramWidget],
  )

  useEffect(() => {
    window[CALLBACK_NAME] = handleAuth
    return () => {
      delete window[CALLBACK_NAME]
    }
  }, [handleAuth])

  useEffect(() => {
    const slot = widgetSlotRef.current
    if (!slot || !botName) return
    setWidgetReady(false)

    // Telegram's loader only renders the button when the <script> is parsed
    // *inside* the target slot. Manually attach + dataset + onload so we
    // can show a fallback if the network blocks it.
    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.async = true
    script.dataset.telegramLogin = botName
    script.dataset.size = 'large'
    script.dataset.radius = '8'
    script.dataset.requestAccess = 'write'
    script.dataset.onauth = `${CALLBACK_NAME}(user)`
    script.onload = () => setWidgetReady(true)
    script.onerror = () => setWidgetReady(false)
    slot.appendChild(script)
    scriptRef.current = script

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
      slot.replaceChildren()
      scriptRef.current = null
    }
    // reloadKey is in the dep list so "Retry" can re-mount the script tag.
  }, [botName, reloadKey])

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-10 text-ink">
      <div className="card-shell flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <BrandMark size={56} radius={14} />
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-2xl italic leading-tight text-ink">
            {t('webLogin.title')}
          </h1>
          <p className="text-sm text-muted">{t('webLogin.subtitle')}</p>
        </div>

        {botName ? (
          <div className="flex min-h-[64px] w-full items-center justify-center">
            <div ref={widgetSlotRef} aria-label={t('webLogin.cta')} />
            {!widgetReady ? (
              <div className="absolute">
                <BrandSpinner size="md" />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-danger" role="alert">
            {t('webLogin.missingConfig')}
          </p>
        )}

        {isBootstrapping ? (
          <p className="text-xs text-muted" aria-live="polite">
            {t('root.authorizing')}
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-2" role="alert">
            <p className="text-sm text-danger">{t('webLogin.error')}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-input border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              {t('webLogin.retry')}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  )
}
