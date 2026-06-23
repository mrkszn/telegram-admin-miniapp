import { useCallback, useEffect } from 'react'
import { bootstrapAuth, bootstrapAuthWeb, type TelegramWidgetPayload } from '@/lib/telegram/auth'
import { isInsideTelegram } from '@/lib/telegram/sdk'
import { useSessionStore } from '@/lib/state/session-store'

export interface UseAuthOptions {
  /** Defaults to `import.meta.env.VITE_API_BASE_URL`. */
  apiBaseUrl?: string
  /** Defaults to `import.meta.env.VITE_AUTH_ENDPOINT`. */
  authEndpoint?: string
  /**
   * Defaults to `import.meta.env.VITE_AUTH_WEB_ENDPOINT` (fallback `/admin/auth/web`).
   * Endpoint that accepts a Telegram Login Widget payload outside the WebView.
   */
  authWebEndpoint?: string
  /** Skip bootstrap (e.g. for storybook / preview routes). */
  disabled?: boolean
}

export interface UseAuthResult {
  token: string | null
  isReady: boolean
  isBootstrapping: boolean
  error: string | null
  /**
   * True iff the page was opened outside Telegram. Callers should render a
   * Telegram Login Widget gate and pump its callback into
   * `signInWithTelegramWidget`.
   */
  needsWebLogin: boolean
  /** Trade a widget payload for a JWT via POST /admin/auth/web. */
  signInWithTelegramWidget(payload: TelegramWidgetPayload): Promise<void>
}

/**
 * On first mount:
 * - inside Telegram → exchanges `initData` for a JWT (legacy mini-app flow).
 * - outside Telegram → no auto-bootstrap; `needsWebLogin` flips true and a
 *   Telegram Login Widget should drive `signInWithTelegramWidget()`.
 *
 * Safe to call from multiple components; the underlying Zustand store
 * deduplicates the bootstrap call.
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthResult {
  const token = useSessionStore((s) => s.token)
  const isReady = useSessionStore((s) => s.isReady)
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping)
  const error = useSessionStore((s) => s.error)

  const apiBaseUrl = options.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? ''
  const authEndpoint =
    options.authEndpoint ?? import.meta.env.VITE_AUTH_ENDPOINT ?? '/admin/auth'
  const authWebEndpoint =
    options.authWebEndpoint ?? import.meta.env.VITE_AUTH_WEB_ENDPOINT ?? '/admin/auth/web'
  const disabled = options.disabled ?? false

  useEffect(() => {
    if (disabled) return
    if (!isInsideTelegram()) return
    const state = useSessionStore.getState()
    if (state.token || state.isBootstrapping) return
    void bootstrapAuth({ apiBaseUrl, authEndpoint }).catch(() => {
      // store already recorded the error; swallow to avoid unhandled rejection
    })
  }, [apiBaseUrl, authEndpoint, disabled])

  const signInWithTelegramWidget = useCallback(
    async (payload: TelegramWidgetPayload) => {
      await bootstrapAuthWeb(payload, { apiBaseUrl, authEndpoint: authWebEndpoint })
    },
    [apiBaseUrl, authWebEndpoint],
  )

  const needsWebLogin = !isReady && !isBootstrapping && !isInsideTelegram()

  return {
    token,
    isReady,
    isBootstrapping,
    error,
    needsWebLogin,
    signInWithTelegramWidget,
  }
}
