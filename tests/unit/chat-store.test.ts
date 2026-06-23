/**
 * useChatStore 401 retry path — branches on `isInsideTelegram()`:
 *  - inside TG → silent re-bootstrap + retry (legacy mini-app flow).
 *  - outside TG → clears the session so RootRoute can bounce the user to
 *    <TelegramLoginGate>, no misleading "Telegram initData is missing".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApiError, AskRequest, AskResponse } from '@/lib/api/types'
import { useSessionStore } from '@/lib/state/session-store'

const askAdmin = vi.fn<(body: AskRequest) => Promise<AskResponse>>()
const bootstrapAuth = vi.fn<() => Promise<{ token: string }>>()

vi.mock('@/lib/api/admin', () => ({
  askAdmin: (body: AskRequest) => askAdmin(body),
}))
vi.mock('@/lib/telegram/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/telegram/auth')>(
    '@/lib/telegram/auth',
  )
  return {
    ...actual,
    bootstrapAuth: () => bootstrapAuth(),
  }
})

const { useChatStore } = await import('@/lib/state/chat-store')

function unauthorized(): ApiError {
  return { status: 401, message: 'unauthorized' }
}

function mockTelegram(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Telegram = {
    WebApp: {
      initData: 'init=xyz',
      initDataUnsafe: { user: { id: 42 } },
      ready: () => {},
      expand: () => {},
    },
  }
}

beforeEach(() => {
  askAdmin.mockReset()
  bootstrapAuth.mockReset()
  useSessionStore.getState().clear()
  useChatStore.setState({
    messages: [],
    isBusy: false,
    error: null,
    queued: null,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Telegram
  useSessionStore.getState().setSession('jwt-stale', { telegramId: 42 })
})

describe('chat-store 401 fallback', () => {
  it('inside Telegram: silently re-bootstraps and retries the question', async () => {
    mockTelegram()
    askAdmin.mockRejectedValueOnce(unauthorized()).mockResolvedValueOnce({
      answer_text: 'pong',
      tools_used: [],
      chart_text: null,
    })
    bootstrapAuth.mockResolvedValueOnce({ token: 'jwt-fresh' })

    await useChatStore.getState().send('hi')

    expect(bootstrapAuth).toHaveBeenCalledTimes(1)
    expect(askAdmin).toHaveBeenCalledTimes(2)
    const state = useChatStore.getState()
    expect(state.error).toBeNull()
    expect(state.messages.at(-1)?.content).toBe('pong')
    // Session token is whatever bootstrapAuth wrote; we don't clear it here.
    expect(useSessionStore.getState().token).toBe('jwt-stale')
  })

  it('outside Telegram: clears the session and surfaces the 401 (no initData retry)', async () => {
    // No window.Telegram → isInsideTelegram() is false.
    askAdmin.mockRejectedValueOnce(unauthorized())

    await useChatStore.getState().send('hi')

    expect(bootstrapAuth).not.toHaveBeenCalled()
    expect(askAdmin).toHaveBeenCalledTimes(1)
    // Session cleared so RootRoute can render the gate.
    expect(useSessionStore.getState().token).toBeNull()
    // Chat error is the 401 message, NOT "Telegram initData is missing".
    const chatErr = useChatStore.getState().error
    expect(chatErr).toBe('unauthorized')
    expect(chatErr).not.toMatch(/initData/)
  })
})
