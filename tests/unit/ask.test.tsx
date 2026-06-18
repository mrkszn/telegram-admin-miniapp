/**
 * /ask wiring — chat widget round-trip + chart_text rendering + 401
 * retry. Mocks askAdmin and bootstrapAuth.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { AskRequest, AskResponse } from '@/lib/api/types'

const askAdmin = vi.fn<(body: AskRequest) => Promise<AskResponse>>()
const bootstrapAuth = vi.fn<() => Promise<void>>()

vi.mock('@/lib/api/admin', () => ({
  askAdmin: (body: AskRequest) => askAdmin(body),
}))

vi.mock('@/lib/telegram/auth', () => ({
  bootstrapAuth: () => bootstrapAuth(),
}))

const { AskRoute } = await import('@/routes/ask')

beforeEach(() => {
  askAdmin.mockReset()
  bootstrapAuth.mockReset()
})

describe('AskRoute', () => {
  it('renders suggested prompts in the empty state and does not call backend', () => {
    render(
      <MemoryRouter initialEntries={['/ask']}>
        <AskRoute />
      </MemoryRouter>,
    )
    expect(screen.getByText('Запитайте про дані.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Топ-3 скарги за тиждень' })).toBeInTheDocument()
    expect(askAdmin).not.toHaveBeenCalled()
  })

  it('submitting a message posts question + history and renders the assistant reply', async () => {
    askAdmin.mockResolvedValueOnce({
      answer_text: 'За неделю топ жалоба — медленный счёт.',
      tools_used: ['topics'],
      chart_text: null,
    })
    render(
      <MemoryRouter initialEntries={['/ask']}>
        <AskRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    const textarea = screen.getByLabelText('Повідомлення')
    await user.type(textarea, 'Что хвалят клиенты?')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    await waitFor(() => expect(askAdmin).toHaveBeenCalledTimes(1))
    const body = askAdmin.mock.calls[0]?.[0]
    expect(body?.question).toBe('Что хвалят клиенты?')
    // History should include the user message we just sent
    expect(body?.history?.length).toBe(1)
    expect(body?.history?.[0]).toEqual({ role: 'user', content: 'Что хвалят клиенты?' })

    expect(await screen.findByText(/топ жалоба — медленный счёт/i)).toBeInTheDocument()
  })

  it('renders chart_text in a monospace block under the message', async () => {
    askAdmin.mockResolvedValueOnce({
      answer_text: 'Динамика рейтинга:',
      tools_used: ['metrics'],
      chart_text: 'Пн 4.2\nВт 4.4\nСр 4.5',
    })
    render(
      <MemoryRouter initialEntries={['/ask']}>
        <AskRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Повідомлення'), 'Покажи рейтинг')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    expect(await screen.findByText(/Динамика рейтинга/)).toBeInTheDocument()
    expect(screen.getByText(/Пн 4\.2/)).toBeInTheDocument()
  })

  it('on 401 re-bootstraps auth and retries transparently', async () => {
    askAdmin
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401, data: { message: 'expired' } },
        message: 'Request failed with status code 401',
      })
      .mockResolvedValueOnce({
        answer_text: 'после retry',
        tools_used: [],
        chart_text: null,
      })
    bootstrapAuth.mockResolvedValueOnce(undefined as unknown as void)

    render(
      <MemoryRouter initialEntries={['/ask']}>
        <AskRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Повідомлення'), 'привет')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    await waitFor(() => expect(bootstrapAuth).toHaveBeenCalledTimes(1))
    expect(askAdmin).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('после retry')).toBeInTheDocument()
  })
})
