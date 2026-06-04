import { describe, it, expect, beforeEach, vi } from 'vitest'
import { bootstrapAuth } from '@/lib/telegram/auth'
import { useSessionStore } from '@/lib/state/session-store'

function mockTelegram(initData = 'query_id=AA&user=%7B%22id%22%3A42%7D&hash=abc') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Telegram = {
    WebApp: {
      initData,
      initDataUnsafe: { user: { id: 42, first_name: 'Alex', username: 'alex' } },
      version: '7.0',
      platform: 'web',
      colorScheme: 'light',
      themeParams: {},
      isExpanded: true,
      viewportHeight: 800,
      viewportStableHeight: 800,
      ready: () => {},
      expand: () => {},
      close: () => {},
      onEvent: () => {},
      offEvent: () => {},
      BackButton: {
        isVisible: false,
        show: () => {},
        hide: () => {},
        onClick: () => {},
        offClick: () => {},
      },
      MainButton: {
        text: '',
        isVisible: false,
        isActive: false,
        show: () => {},
        hide: () => {},
        enable: () => {},
        disable: () => {},
        setText: () => {},
        onClick: () => {},
        offClick: () => {},
      },
    },
  }
}

describe('bootstrapAuth', () => {
  beforeEach(() => {
    useSessionStore.getState().clear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram
  })

  it('POSTs initData to apiBaseUrl + authEndpoint and stores the token', async () => {
    mockTelegram('init=xyz')
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-123' }),
    })

    const result = await bootstrapAuth({
      apiBaseUrl: 'https://api.example.com',
      authEndpoint: '/auth/telegram',
      fetcher: fetcher as unknown as typeof fetch,
    })

    expect(result.token).toBe('jwt-123')
    expect(fetcher).toHaveBeenCalledOnce()
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.example.com/auth/telegram')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ init_data: 'init=xyz' }))

    const store = useSessionStore.getState()
    expect(store.token).toBe('jwt-123')
    expect(store.user?.telegramId).toBe(42)
    expect(store.isReady).toBe(true)
    expect(store.error).toBeNull()
  })

  it('joins baseUrl + endpoint regardless of trailing/leading slashes', async () => {
    mockTelegram('x')
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 't' }),
    })
    await bootstrapAuth({
      apiBaseUrl: 'https://api.example.com/',
      authEndpoint: 'auth/telegram',
      fetcher: fetcher as unknown as typeof fetch,
    })
    const calls = fetcher.mock.calls as [string, RequestInit][]
    expect(calls[0]![0]).toBe('https://api.example.com/auth/telegram')
  })

  it('records error when initData is missing', async () => {
    const fetcher = vi.fn()
    await expect(
      bootstrapAuth({
        apiBaseUrl: 'https://api.example.com',
        authEndpoint: '/auth/telegram',
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/initData is missing/)
    expect(fetcher).not.toHaveBeenCalled()
    expect(useSessionStore.getState().error).toMatch(/initData is missing/)
    expect(useSessionStore.getState().isReady).toBe(false)
  })

  it('records error on non-2xx response', async () => {
    mockTelegram()
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) })
    await expect(
      bootstrapAuth({
        apiBaseUrl: 'https://api.example.com',
        authEndpoint: '/auth/telegram',
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/HTTP 401/)
    expect(useSessionStore.getState().error).toMatch(/HTTP 401/)
    expect(useSessionStore.getState().token).toBeNull()
  })

  it('records error when response missing token', async () => {
    mockTelegram()
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    await expect(
      bootstrapAuth({
        apiBaseUrl: 'https://api.example.com',
        authEndpoint: '/auth/telegram',
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/missing token/)
    expect(useSessionStore.getState().token).toBeNull()
  })
})
