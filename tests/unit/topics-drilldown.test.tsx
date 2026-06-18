/**
 * /topics drill-down: a topic row opens the clients-by-topic sheet, and a
 * tap on a client opens the shared profile sheet. Exercises the reusable
 * ClientListSheet → ClientProfileSheet stack.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type {
  ClientProfileResponse,
  ClientsResponse,
  TopicsResponse,
} from '@/lib/api/types'

const fetchTopics = vi.fn<() => Promise<TopicsResponse>>()
const fetchTopicClients = vi.fn<(topic: string) => Promise<ClientsResponse>>()
const fetchClientProfile = vi.fn<(id: number) => Promise<ClientProfileResponse>>()

vi.mock('@/lib/api/admin', () => ({
  fetchTopics: () => fetchTopics(),
  fetchTopicClients: (topic: string) => fetchTopicClients(topic),
  fetchClientProfile: (id: number) => fetchClientProfile(id),
}))

const { TopicsRoute } = await import('@/routes/topics')

const topics: TopicsResponse = {
  topics: [{ topic: 'сервіс', count: 5, avg_sentiment: 0.6 }],
}
const clients: ClientsResponse = {
  clients: [
    {
      telegram_id: 42,
      name: 'Alice',
      sessions_count: 3,
      last_session_at: '2026-05-30T18:21:00Z',
      avg_sentiment: 0.5,
    },
  ],
}
const profile: ClientProfileResponse = {
  telegram_id: 42,
  name: 'Alice',
  sessions_count: 3,
  last_session_at: '2026-05-30T18:21:00Z',
  avg_sentiment: 0.5,
  recent_cards: [],
  top_topics: [],
}

beforeEach(() => {
  fetchTopics.mockReset()
  fetchTopicClients.mockReset()
  fetchClientProfile.mockReset()
})

describe('TopicsRoute drill-down', () => {
  it('topic row → clients sheet → client profile', async () => {
    fetchTopics.mockResolvedValue(topics)
    fetchTopicClients.mockResolvedValue(clients)
    fetchClientProfile.mockResolvedValue(profile)
    render(
      <MemoryRouter initialEntries={['/topics']}>
        <TopicsRoute />
      </MemoryRouter>,
    )

    // top-5 bars list renders the topic; click it
    const bars = await screen.findByTestId('topic-bars')
    await userEvent.setup().click(within(bars).getByRole('button', { name: /сервіс/ }))

    await waitFor(() => expect(fetchTopicClients).toHaveBeenCalledWith('сервіс'))
    const list = await screen.findByTestId('client-list')
    await userEvent.setup().click(within(list).getByText('Alice'))

    await waitFor(() => expect(fetchClientProfile).toHaveBeenCalledWith(42))
  })
})
