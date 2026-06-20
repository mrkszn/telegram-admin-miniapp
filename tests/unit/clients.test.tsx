/**
 * /clients wiring — debounced search → POST /admin/semantic → hit list →
 * Sheet → GET /admin/clients/{id}.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type {
  ClientProfileResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
} from '@/lib/api/types'

const semanticSearch =
  vi.fn<(body: SemanticSearchRequest) => Promise<SemanticSearchResponse>>()
const fetchClientProfile = vi.fn<(id: number) => Promise<ClientProfileResponse>>()

vi.mock('@/lib/api/admin', () => ({
  semanticSearch: (body: SemanticSearchRequest) => semanticSearch(body),
  fetchClientProfile: (id: number) => fetchClientProfile(id),
}))

const { ClientsRoute } = await import('@/routes/clients')

const sampleHits: SemanticSearchResponse = {
  hits: [
    {
      session_id: 's-1',
      client_id: 42,
      score: 0.91,
      summary_text: 'Жалоба на скорость подачи блюд за обедом',
      sentiment: 'negative',
      started_at: '2026-05-30T18:21:00Z',
    },
    {
      session_id: 's-2',
      client_id: 17,
      score: 0.83,
      summary_text: 'Похвалил вежливость официанта',
      sentiment: 'positive',
      started_at: '2026-05-28T12:11:00Z',
    },
  ],
}

const sampleProfile: ClientProfileResponse = {
  telegram_id: 42,
  name: 'Анна Иванова',
  sessions_count: 7,
  last_session_at: '2026-05-30T18:21:00Z',
  avg_sentiment: -0.18,
  recent_cards: [{ topic: 'wait_time', mentioned: true }],
  top_topics: [
    { topic: 'wait_time', count: 3, avg_sentiment: -0.5 },
    { topic: 'service', count: 2, avg_sentiment: 0.2 },
  ],
}

beforeEach(() => {
  semanticSearch.mockReset()
  fetchClientProfile.mockReset()
})

describe('ClientsRoute', () => {
  it('shows suggestions when query is empty and does not call the backend', () => {
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <ClientsRoute />
      </MemoryRouter>,
    )
    expect(screen.getByText('Запитайте голосом власника.')).toBeInTheDocument()
    // any one suggestion chip
    expect(screen.getByRole('button', { name: 'скарги на доставку' })).toBeInTheDocument()
    expect(semanticSearch).not.toHaveBeenCalled()
  })

  it('debounced search fires POST /admin/semantic with the trimmed query', async () => {
    semanticSearch.mockResolvedValueOnce(sampleHits)
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <ClientsRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Пошук клієнтів'), 'долгое ожидание')
    await waitFor(() => expect(semanticSearch).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    })
    expect(semanticSearch.mock.calls[0]?.[0]).toEqual({
      query: 'долгое ожидание',
      top_k: 10,
    })
    expect(await screen.findByTestId('hit-list')).toBeInTheDocument()
    expect(screen.getByText('Клієнт 42')).toBeInTheDocument()
    expect(screen.getByText('Клієнт 17')).toBeInTheDocument()
  })

  it('clicking a hit opens the Sheet and fetches the client profile', async () => {
    semanticSearch.mockResolvedValueOnce(sampleHits)
    fetchClientProfile.mockResolvedValueOnce(sampleProfile)
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <ClientsRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Пошук клієнтів'), 'ожидание')
    await screen.findByText('Клієнт 42')
    await user.click(screen.getByText('Клієнт 42'))

    await waitFor(() => expect(fetchClientProfile).toHaveBeenCalledWith(42))
    expect(await screen.findByText('Анна Иванова')).toBeInTheDocument()
    expect(screen.getByText('Сесій')).toBeInTheDocument()
    // sessions value (Сессий = 7)
    expect(screen.getByText('7')).toBeInTheDocument()
    // signed sentiment (-0.18) — CountUp formats via toLocaleString('ru-RU'),
    // so the decimal separator is a comma.
    expect(screen.getByText('-0,18')).toBeInTheDocument()
    // first top topic — appears in both top_topics chips and recent_cards JSON
    expect(screen.getAllByText(/wait_time/).length).toBeGreaterThanOrEqual(1)
  })

  it('sessions tile is clickable and reveals a session list inside the drawer', async () => {
    semanticSearch.mockResolvedValueOnce(sampleHits)
    fetchClientProfile.mockResolvedValueOnce({
      ...sampleProfile,
      recent_cards: [
        {
          session_id: 'sess-A',
          created_at: '2026-05-30T18:21:00Z',
          summary_text: 'Жалоба на скорость',
          sentiment: 'negative',
          topics: ['wait_time'],
        },
        {
          session_id: 'sess-B',
          created_at: '2026-05-20T12:11:00Z',
          summary_text: 'Похвала сомелье',
          sentiment: 'positive',
          topics: ['vino'],
        },
      ],
    })
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <ClientsRoute />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Пошук клієнтів'), 'ожидание')
    await screen.findByText('Клієнт 42')
    await user.click(screen.getByText('Клієнт 42'))
    await screen.findByText('Анна Иванова')

    await user.click(screen.getByRole('button', { name: 'Переглянути сесії' }))

    const list = await screen.findByTestId('client-sessions')
    expect(list).toBeInTheDocument()
    expect(screen.getByText('Жалоба на скорость')).toBeInTheDocument()
    expect(screen.getByText('Похвала сомелье')).toBeInTheDocument()
  })
})
