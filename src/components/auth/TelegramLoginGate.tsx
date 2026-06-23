import { useCallback, useEffect, useRef, useState } from 'react'
import { BrandMark } from '@/components/brand/BrandMark'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { useT } from '@/lib/i18n'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSessionStore } from '@/lib/state/session-store'
import type { TelegramWidgetPayload } from '@/lib/telegram/auth'

/**
 * Where the Telegram Login Widget hangs its JS callback. The widget calls
 * `window[name](user)` when the user authorises in the popup. We use a
 * static name and clean it up on unmount.
 */
const CALLBACK_NAME = 'onTelegramAuth' as const

const WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22'

/**
 * How long we wait for the widget's `<iframe>` to appear after the script
 * loads. The script's `onload` fires when the JS parses, not when the iframe
 * mounts — so on slow links, hosts not whitelisted in @BotFather, or anything
 * Telegram silently rejects, the slot would otherwise stay blank forever. If
 * the iframe doesn't appear within this window, we surface a friendly error.
 */
const WIDGET_RENDER_TIMEOUT_MS = 8000

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
 * silently renders nothing and we surface `webLogin.widgetUnavailable`.
 */
export function TelegramLoginGate() {
  const t = useT()
  const { signInWithTelegramWidget, isBootstrapping, error } = useAuth()
  const widgetSlotRef = useRef<HTMLDivElement | null>(null)
  const inFlightRef = useRef(false)
  const [widgetReady, setWidgetReady] = useState(false)
  const [widgetError, setWidgetError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const botName = (import.meta.env.VITE_TELEGRAM_BOT_NAME ?? '').trim()

  const handleAuth = useCallback(
    (user: TelegramWidgetPayload) => {
      // Telegram has been observed firing `onauth` twice on slow networks,
      // and a Retry-driven remount can replay a queued auth from the same
      // OAuth session. Guard so we only POST once until the response lands.
      if (inFlightRef.current) return
      inFlightRef.current = true
      void signInWithTelegramWidget(user)
        .catch(() => {
          // store recorded the error; UI re-renders from useAuth().error
        })
        .finally(() => {
          inFlightRef.current = false
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
    setWidgetError(false)

    // Telegram's loader only renders the button when the <script> is parsed
    // *inside* the target slot. Manually attach + dataset so we can observe
    // the iframe insertion and surface a fallback when the loader is silent.
    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.async = true
    script.dataset.telegramLogin = botName
    script.dataset.size = 'large'
    script.dataset.radius = '8'
    script.dataset.requestAccess = 'write'
    script.dataset.onauth = `${CALLBACK_NAME}(user)`
    script.onerror = () => setWidgetError(true)
    slot.appendChild(script)

    // Resolve `widgetReady` only when the actual iframe button appears in
    // the slot — `onload` only proves the JS parsed. If the iframe never
    // arrives within the timeout, surface a friendly error.
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new MutationObserver(() => {
      if (slot.querySelector('iframe')) {
        setWidgetReady(true)
        observer.disconnect()
        if (timer) clearTimeout(timer)
      }
    })
    observer.observe(slot, { childList: true, subtree: true })

    timer = setTimeout(() => {
      if (!slot.querySelector('iframe')) setWidgetError(true)
    }, WIDGET_RENDER_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
      if (script.parentNode) script.parentNode.removeChild(script)
      slot.replaceChildren()
    }
    // reloadKey is in the dep list so "Retry" can re-mount the script tag.
  }, [botName, reloadKey])

  const onRetry = useCallback(() => {
    // Clear the lingering store error before re-mounting so the alert
    // stops shouting next to the fresh widget.
    useSessionStore.getState().setError(null)
    setReloadKey((k) => k + 1)
  }, [])

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

        {!botName ? (
          <p className="text-sm text-danger" role="alert">
            {t('webLogin.missingConfig')}
          </p>
        ) : widgetError ? (
          <div className="flex flex-col items-center gap-2" role="alert">
            <p className="text-sm text-danger">{t('webLogin.widgetUnavailable')}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-input border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              {t('webLogin.retry')}
            </button>
          </div>
        ) : (
          <div className="relative flex min-h-[64px] w-full items-center justify-center">
            <div ref={widgetSlotRef} aria-label={t('webLogin.cta')} />
            {!widgetReady ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <BrandSpinner size="md" />
              </div>
            ) : null}
          </div>
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
              onClick={onRetry}
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
