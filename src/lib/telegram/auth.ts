import { readyTelegram, type TelegramWebApp } from './sdk'
import { useSessionStore, type SessionUser } from '@/lib/state/session-store'

type TelegramInitUser = NonNullable<TelegramWebApp['initDataUnsafe']['user']>

export interface BootstrapAuthOptions {
  apiBaseUrl: string
  authEndpoint: string
  /** Override the fetch implementation (useful for tests). */
  fetcher?: typeof fetch
}

export interface AuthResponse {
  token: string
  user?: {
    telegram_id?: number
    first_name?: string
    last_name?: string
    username?: string
    language_code?: string
  }
}

/**
 * Exchanges Telegram `initData` for a JWT against the configured backend.
 * Writes the result into the Zustand session store on success.
 *
 * Returns the auth response on success, or throws on failure (the store also
 * records `error`, so callers can render UI from store state alone).
 */
export async function bootstrapAuth(opts: BootstrapAuthOptions): Promise<AuthResponse> {
  const { apiBaseUrl, authEndpoint, fetcher = fetch } = opts
  const store = useSessionStore.getState()
  store.setBootstrapping(true)
  store.setError(null)
  try {
    const tg = readyTelegram()
    const initData = tg?.initData ?? ''
    if (!initData) {
      throw new Error('Telegram initData is missing — open this page inside Telegram.')
    }
    const url = joinUrl(apiBaseUrl, authEndpoint)
    const response = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ init_data: initData }),
    })
    if (!response.ok) {
      throw new Error(`Auth failed: HTTP ${response.status}`)
    }
    const data = (await response.json()) as AuthResponse
    if (!data?.token) {
      throw new Error('Auth response missing token')
    }
    const sessionUser = mergeUser(tg?.initDataUnsafe.user, data.user)
    useSessionStore.getState().setSession(data.token, sessionUser)
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown auth error'
    useSessionStore.getState().setError(message)
    throw err
  } finally {
    useSessionStore.getState().setBootstrapping(false)
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

function mergeUser(
  tgUser: TelegramInitUser | undefined,
  apiUser: AuthResponse['user'],
): SessionUser | null {
  const telegramId = apiUser?.telegram_id ?? tgUser?.id
  if (typeof telegramId !== 'number') return null
  return {
    telegramId,
    firstName: apiUser?.first_name ?? tgUser?.first_name,
    lastName: apiUser?.last_name ?? tgUser?.last_name,
    username: apiUser?.username ?? tgUser?.username,
    languageCode: apiUser?.language_code ?? tgUser?.language_code,
  }
}
