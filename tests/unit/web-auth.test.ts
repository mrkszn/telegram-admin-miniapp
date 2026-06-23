/**
 * Web auth flow — POST /admin/auth/web for the Telegram Login Widget.
 * Mirrors tests/unit/auth.test.ts shape so the contract is obvious.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  bootstrapAuthWeb,
  type TelegramWidgetPayload,
} from '@/lib/telegram/auth'
import { useSessionStore } from '@/lib/state/session-store'

const samplePayload: TelegramWidgetPayload = {
  id: 42,
  first_name: 'Alex',
  username: 'alex',
  auth_date: 1719000000,
  hash: 'abc',
}

describe('bootstrapAuthWeb', () => {
  beforeEach(() => {
    useSessionStore.getState().clear()
  })

  it('POSTs the widget payload as-is and stores the token + user', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-web' }),
    })

    const result = await bootstrapAuthWeb(samplePayload, {
      apiBaseUrl: 'https://api.example.com',
      authEndpoint: '/admin/auth/web',
      fetcher: fetcher as unknown as typeof fetch,
    })

    expect(result.token).toBe('jwt-web')
    expect(fetcher).toHaveBeenCalledOnce()
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.example.com/admin/auth/web')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual(samplePayload)

    const store = useSessionStore.getState()
    expect(store.token).toBe('jwt-web')
    expect(store.user?.telegramId).toBe(42)
    expect(store.user?.firstName).toBe('Alex')
    expect(store.user?.username).toBe('alex')
    expect(store.isReady).toBe(true)
    expect(store.error).toBeNull()
  })

  it('records the HTTP status when the backend rejects the payload', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
    })
    await expect(
      bootstrapAuthWeb(samplePayload, {
        apiBaseUrl: 'https://api.example.com',
        authEndpoint: '/admin/auth/web',
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/HTTP 403/)
    expect(useSessionStore.getState().error).toMatch(/HTTP 403/)
    expect(useSessionStore.getState().token).toBeNull()
    expect(useSessionStore.getState().isReady).toBe(false)
  })

  it('records error when response is missing token', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    await expect(
      bootstrapAuthWeb(samplePayload, {
        apiBaseUrl: 'https://api.example.com',
        authEndpoint: '/admin/auth/web',
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/missing token/)
    expect(useSessionStore.getState().token).toBeNull()
  })

  it('prefers the backend user object over the widget payload', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          token: 'jwt-web',
          user: {
            telegram_id: 7,
            first_name: 'Server',
            username: 'srv',
            language_code: 'en',
          },
        }),
    })
    await bootstrapAuthWeb(samplePayload, {
      apiBaseUrl: 'https://api.example.com',
      authEndpoint: '/admin/auth/web',
      fetcher: fetcher as unknown as typeof fetch,
    })
    const user = useSessionStore.getState().user
    expect(user?.telegramId).toBe(7)
    expect(user?.firstName).toBe('Server')
    expect(user?.languageCode).toBe('en')
  })
})
