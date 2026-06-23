/**
 * Chat-landing wiring — chat widget round-trip + chart_text rendering + 401
 * retry. Mocks askAdmin and bootstrapAuth. The route now lives at `/`
 * (was `/ask`), so the assertions and the MemoryRouter entry point follow.
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

const { ChatRoute } = await import('@/routes/chat')
const { useChatStore } = await import('@/lib/state/chat-store')
// Pre-warm the lazy chart chunk. In prod it's loaded on first chart_text;
// here we eagerly evaluate it during module collection so its transitive
// @headlessui import runs before @testing-library/user-event swaps the
// global focus shim, which otherwise crashes Headless UI's setup.
await import('@/components/chat/ChartFromTextImpl')

beforeEach(() => {
  askAdmin.mockReset()
  bootstrapAuth.mockReset()
  // The chat store persists messages to localStorage — wipe between tests
  // so the empty-state assertions stay honest.
  useChatStore.getState().clearChat()
})

describe('ChatRoute', () => {
  it('renders suggested prompts in the empty state and does not call backend', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatRoute />
      </MemoryRouter>,
    )
    expect(screen.getByText('Спитай про feedback.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Топ скарг тижня' })).toBeInTheDocument()
    expect(askAdmin).not.toHaveBeenCalled()
  })

  it('submitting a message posts question + history and renders the assistant reply', async () => {
    askAdmin.mockResolvedValueOnce({
      answer_text: 'За тиждень топ скарга — повільний рахунок.',
      tools_used: ['topics'],
      chart_text: null,
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    const textarea = screen.getByLabelText('Повідомлення')
    await user.type(textarea, 'Що хвалять клієнти?')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    await waitFor(() => expect(askAdmin).toHaveBeenCalledTimes(1))
    const body = askAdmin.mock.calls[0]?.[0]
    expect(body?.question).toBe('Що хвалять клієнти?')
    expect(body?.history?.length).toBe(1)
    expect(body?.history?.[0]).toEqual({ role: 'user', content: 'Що хвалять клієнти?' })

    expect(await screen.findByText(/повільний рахунок/i)).toBeInTheDocument()
  })

  it('renders chart_text in a monospace block under the message', async () => {
    askAdmin.mockResolvedValueOnce({
      answer_text: 'Динаміка рейтингу:',
      tools_used: ['metrics'],
      chart_text: 'Пн 4.2\nВт 4.4\nСр 4.5',
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Повідомлення'), 'Покажи рейтинг')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    expect(await screen.findByText(/Динаміка рейтингу/)).toBeInTheDocument()
    // ChartFromText is lazy-loaded (Tremor lives in a separate chunk), so
    // we need to wait for the impl module's dynamic import to resolve.
    expect(await screen.findByText(/Пн 4\.2/)).toBeInTheDocument()
  })

  it('clearChat mid-flight drops the resolved agent reply (no orphan bubble)', async () => {
    // Hand-crafted deferred promise so we can clear the chat while the
    // request is mid-flight, then resolve it and assert nothing landed.
    let resolveAsk: (res: AskResponse) => void = () => {}
    askAdmin.mockImplementationOnce(
      () =>
        new Promise<AskResponse>((resolve) => {
          resolveAsk = resolve
        }),
    )

    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Повідомлення'), 'Питання')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    // The user message is on screen; agent is "still thinking".
    expect(await screen.findByText('Питання')).toBeInTheDocument()

    // Clear the chat while the request is in flight — this is the +
    // ("Новий чат") affordance in the header.
    await Promise.resolve().then(() => useChatStore.getState().clearChat())

    // The resolved reply must NOT be appended — the chat stays empty.
    resolveAsk({ answer_text: 'orphan reply', tools_used: [], chart_text: null })
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByText('orphan reply')).not.toBeInTheDocument()
    expect(useChatStore.getState().messages).toEqual([])
    expect(useChatStore.getState().isBusy).toBe(false)
  })

  it('on 401 re-bootstraps auth and retries transparently', async () => {
    askAdmin
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401, data: { message: 'expired' } },
        message: 'Request failed with status code 401',
      })
      .mockResolvedValueOnce({
        answer_text: 'після retry',
        tools_used: [],
        chart_text: null,
      })
    bootstrapAuth.mockResolvedValueOnce(undefined as unknown as void)

    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Повідомлення'), 'привіт')
    await user.click(screen.getByRole('button', { name: 'Відправити' }))

    await waitFor(() => expect(bootstrapAuth).toHaveBeenCalledTimes(1))
    expect(askAdmin).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('після retry')).toBeInTheDocument()
  })
})
