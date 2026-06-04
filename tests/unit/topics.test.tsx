/**
 * /topics wiring — asserts:
 *  1. initial request asks for sentiment=positive
 *  2. switching to the «Негативные» tab triggers a new request with
 *     sentiment=negative
 *  3. top-5 bars + per-topic table render with the topic names
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { TopicsQuery } from '@/lib/api/admin'
import type { TopicsResponse } from '@/lib/api/types'

const fetchTopics = vi.fn<(args: TopicsQuery) => Promise<TopicsResponse>>()

vi.mock('@/lib/api/admin', () => ({
  fetchTopics: (args: TopicsQuery) => fetchTopics(args),
}))

const { TopicsRoute } = await import('@/routes/topics')

function positiveResponse(): TopicsResponse {
  return {
    topics: [
      { topic: 'Скорость подачи', count: 22, avg_sentiment: 0.7 },
      { topic: 'Дружелюбный персонал', count: 18, avg_sentiment: 0.6 },
      { topic: 'Атмосфера', count: 12, avg_sentiment: 0.55 },
    ],
  }
}

function negativeResponse(): TopicsResponse {
  return {
    topics: [
      { topic: 'Медленный счёт', count: 14, avg_sentiment: -0.6 },
      { topic: 'Шумно', count: 7, avg_sentiment: -0.4 },
    ],
  }
}

beforeEach(() => {
  fetchTopics.mockReset()
})

describe('TopicsRoute', () => {
  it('fetches positive topics on mount + renders the top-5 bars', async () => {
    fetchTopics.mockResolvedValueOnce(positiveResponse())
    render(
      <MemoryRouter initialEntries={['/topics']}>
        <TopicsRoute />
      </MemoryRouter>,
    )
    await waitFor(() => expect(fetchTopics).toHaveBeenCalledTimes(1))
    expect(fetchTopics.mock.calls[0]?.[0]?.sentiment).toBe('positive')
    // topic name appears in the bars list AND the table — find ≥2
    await waitFor(() =>
      expect(screen.getAllByText('Скорость подачи').length).toBeGreaterThanOrEqual(2),
    )
    expect(screen.getByText(/Топ-5 · позитив/)).toBeInTheDocument()
    // delta with + sign (table)
    expect(screen.getByText('+0.70')).toBeInTheDocument()
  })

  it('switching to «Негативные» triggers a fetch with sentiment=negative', async () => {
    fetchTopics.mockResolvedValueOnce(positiveResponse())
    fetchTopics.mockResolvedValueOnce(negativeResponse())
    render(
      <MemoryRouter initialEntries={['/topics']}>
        <TopicsRoute />
      </MemoryRouter>,
    )
    await waitFor(() => expect(fetchTopics).toHaveBeenCalledTimes(1))

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Негативные' }))

    await waitFor(() => expect(fetchTopics).toHaveBeenCalledTimes(2))
    expect(fetchTopics.mock.calls[1]?.[0]?.sentiment).toBe('negative')
    await waitFor(() =>
      expect(screen.getAllByText('Медленный счёт').length).toBeGreaterThanOrEqual(2),
    )
    expect(screen.getByText(/Топ-5 · негатив/)).toBeInTheDocument()
  })

  it('renders empty-state when no topics returned', async () => {
    fetchTopics.mockResolvedValueOnce({ topics: [] })
    render(
      <MemoryRouter initialEntries={['/topics']}>
        <TopicsRoute />
      </MemoryRouter>,
    )
    expect(await screen.findByText('За период данных нет.')).toBeInTheDocument()
    // mentions placeholder still renders
    expect(screen.getByText('Следующая итерация')).toBeInTheDocument()
  })
})
