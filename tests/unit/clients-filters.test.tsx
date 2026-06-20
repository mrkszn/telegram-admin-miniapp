/**
 * /clients drill-down search modes:
 *  - "By name" → GET /admin/clients?query=
 *  - "By topics" → GET /admin/clients?topics=…&match= (AND/OR toggle)
 * Semantic mode stays the default and is covered in clients.test.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type {
  ClientsMatch,
  ClientsResponse,
  TopicsResponse,
} from '@/lib/api/types'

const fetchClientsByQuery = vi.fn<(q: string) => Promise<ClientsResponse>>()
const fetchClientsByTopics =
  vi.fn<(topics: string[], match?: ClientsMatch) => Promise<ClientsResponse>>()
const fetchTopics = vi.fn<() => Promise<TopicsResponse>>()
const semanticSearch = vi.fn()
const fetchClientProfile = vi.fn()

vi.mock('@/lib/api/admin', () => ({
  fetchClientsByQuery: (q: string) => fetchClientsByQuery(q),
  fetchClientsByTopics: (topics: string[], match?: ClientsMatch) =>
    fetchClientsByTopics(topics, match),
  fetchTopics: () => fetchTopics(),
  semanticSearch: () => semanticSearch(),
  fetchClientProfile: (id: number) => fetchClientProfile(id),
}))

const { ClientsRoute } = await import('@/routes/clients')

const sampleClients: ClientsResponse = {
  clients: [
    {
      telegram_id: 42,
      name: 'Alice Cooper',
      sessions_count: 5,
      last_session_at: '2026-05-30T18:21:00Z',
      avg_sentiment: 0.4,
    },
  ],
}

const sampleTopics: TopicsResponse = {
  topics: [
    { topic: 'сервіс', count: 12, avg_sentiment: 0.3 },
    { topic: 'їжа', count: 9, avg_sentiment: -0.1 },
  ],
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/clients']}>
      <ClientsRoute />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchClientsByQuery.mockReset()
  fetchClientsByTopics.mockReset()
  fetchTopics.mockReset()
  semanticSearch.mockReset()
  fetchClientProfile.mockReset()
})

describe('ClientsRoute — name lookup', () => {
  it('searches by name and renders the client list', async () => {
    fetchClientsByQuery.mockResolvedValue(sampleClients)
    renderRoute()
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: "За ім'ям" }))
    await user.type(screen.getByLabelText("Пошук за ім'ям або ID"), 'Alice')

    await waitFor(() => expect(fetchClientsByQuery).toHaveBeenCalledWith('Alice'), {
      timeout: 2000,
    })
    expect(await screen.findByTestId('client-list')).toBeInTheDocument()
    expect(screen.getByText('Alice Cooper')).toBeInTheDocument()
    expect(semanticSearch).not.toHaveBeenCalled()
  })

  it('collapses duplicate name matches into a single aggregated row', async () => {
    fetchClientsByQuery.mockResolvedValue({
      clients: [
        {
          telegram_id: 9000036,
          name: 'Татьяна Морозова',
          sessions_count: 2,
          last_session_at: '2026-05-31T12:00:00Z',
          avg_sentiment: 1.0,
        },
        {
          telegram_id: 9000041,
          name: 'Татьяна Морозова',
          sessions_count: 1,
          last_session_at: '2026-06-03T12:00:00Z',
          avg_sentiment: 0,
        },
      ],
    })
    renderRoute()
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: "За ім'ям" }))
    await user.type(screen.getByLabelText("Пошук за ім'ям або ID"), 'Татьяна')

    expect(await screen.findByTestId('client-list')).toBeInTheDocument()
    expect(screen.getAllByText('Татьяна Морозова')).toHaveLength(1)
    // 2 + 1 = 3 aggregated sessions
    expect(screen.getByText(/^3 /)).toBeInTheDocument()
  })
})

describe('ClientsRoute — topic filter', () => {
  it('filters by selected topics with the match mode, toggling AND → OR', async () => {
    fetchTopics.mockResolvedValue(sampleTopics)
    fetchClientsByTopics.mockResolvedValue(sampleClients)
    renderRoute()
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: 'За темами' }))

    // topic universe chips arrive from fetchTopics
    const chip = await screen.findByRole('button', { name: 'сервіс', pressed: false })
    await user.click(chip)

    await waitFor(() =>
      expect(fetchClientsByTopics).toHaveBeenCalledWith(['сервіс'], 'and'),
    )
    expect(await screen.findByText('Alice Cooper')).toBeInTheDocument()

    // flip match to OR → refetch with the same topics
    await user.click(screen.getByRole('button', { name: 'будь-яка' }))
    await waitFor(() =>
      expect(fetchClientsByTopics).toHaveBeenCalledWith(['сервіс'], 'or'),
    )
  })
})
