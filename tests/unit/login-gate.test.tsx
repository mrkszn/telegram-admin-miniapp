/**
 * TelegramLoginGate — renders outside Telegram, drives the Login Widget
 * callback, and surfaces error / retry UI.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSessionStore } from '@/lib/state/session-store'
import type { TelegramWidgetPayload } from '@/lib/telegram/auth'

const bootstrapAuthWeb = vi.fn<
  (payload: TelegramWidgetPayload) => Promise<{ token: string }>
>()
vi.mock('@/lib/telegram/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/telegram/auth')>(
    '@/lib/telegram/auth',
  )
  return {
    ...actual,
    bootstrapAuthWeb: (payload: TelegramWidgetPayload) => bootstrapAuthWeb(payload),
  }
})

const { TelegramLoginGate } = await import('@/components/auth/TelegramLoginGate')

beforeEach(() => {
  bootstrapAuthWeb.mockReset()
  useSessionStore.getState().clear()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Telegram
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).onTelegramAuth
  vi.stubEnv('VITE_TELEGRAM_BOT_NAME', 'testbot')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('TelegramLoginGate', () => {
  it('renders the brand mark, headline and inserts the widget script tag', () => {
    render(<TelegramLoginGate />)
    expect(screen.getByRole('heading', { name: 'Увійти в InsightFlow Admin' })).toBeInTheDocument()
    expect(screen.getByText('Доступ обмежений власником закладу.')).toBeInTheDocument()
    const slot = screen.getByLabelText('Увійти через Telegram')
    const script = slot.querySelector('script')
    expect(script).not.toBeNull()
    expect(script!.src).toContain('telegram-widget.js')
    expect(script!.dataset.telegramLogin).toBe('testbot')
    expect(script!.dataset.onauth).toBe('onTelegramAuth(user)')
  })

  it('shows a config error and no widget when VITE_TELEGRAM_BOT_NAME is empty', () => {
    vi.stubEnv('VITE_TELEGRAM_BOT_NAME', '')
    render(<TelegramLoginGate />)
    expect(
      screen.getByText(/Не налаштовано імʼя бота/),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Увійти через Telegram')).not.toBeInTheDocument()
  })

  it('invokes signInWithTelegramWidget when the widget callback fires', async () => {
    bootstrapAuthWeb.mockResolvedValueOnce({ token: 'jwt-web' })
    render(<TelegramLoginGate />)
    const payload: TelegramWidgetPayload = {
      id: 42,
      first_name: 'Alex',
      auth_date: 1719000000,
      hash: 'abc',
    }
    await act(async () => {
      window.onTelegramAuth?.(payload)
    })
    expect(bootstrapAuthWeb).toHaveBeenCalledWith(payload)
  })

  it('shows the error + retry button when sign-in fails', async () => {
    useSessionStore.getState().setError('HTTP 403')
    render(<TelegramLoginGate />)
    expect(await screen.findByText(/Не вдалося увійти/)).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: 'Спробувати знову' })
    const user = userEvent.setup()
    // Re-mounting the script tag is the only side-effect; assert it doesn't crash.
    await user.click(retry)
    expect(retry).toBeInTheDocument()
  })
})
