/**
 * /dashboard wiring — mocks fetchOverview, renders, asserts the KPI grid
 * and top-topics sections show data from the response.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { OverviewResponse } from '@/lib/api/types'

const fetchOverview = vi.fn<(args: unknown) => Promise<OverviewResponse>>()

vi.mock('@/lib/api/admin', () => ({
  fetchOverview: (args: unknown) => fetchOverview(args),
}))

// Import after mock so the route picks up the mocked module.
const { DashboardRoute } = await import('@/routes/dashboard')

function makeOverview(overrides: Partial<OverviewResponse> = {}): OverviewResponse {
  return {
    sessions_count: 142,
    avg_sentiment: 0.42,
    top_positive_topics: [
      { topic: 'Скорость подачи', count: 18, avg_sentiment: 0.7 },
      { topic: 'Дружелюбный персонал', count: 14, avg_sentiment: 0.6 },
      { topic: 'Вкусная еда', count: 11, avg_sentiment: 0.55 },
      { topic: 'Атмосфера', count: 8, avg_sentiment: 0.5 },
      { topic: 'Чистота', count: 6, avg_sentiment: 0.45 },
    ],
    top_negative_topics: [
      { topic: 'Медленный счёт', count: 9, avg_sentiment: -0.6 },
      { topic: 'Шумно', count: 4, avg_sentiment: -0.4 },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  fetchOverview.mockReset()
})

describe('DashboardRoute', () => {
  it('renders KPI grid + top topics + top-5 list once data arrives', async () => {
    fetchOverview.mockResolvedValueOnce(makeOverview())
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardRoute />
      </MemoryRouter>,
    )

    await waitFor(() => expect(fetchOverview).toHaveBeenCalled())

    // KPI cards (scoped lookup so digits in the Top-5 list don't clash)
    const kpiSessions = screen.getByText('Сессий').closest('div')!.parentElement!
    expect(within(kpiSessions).getByText('142')).toBeInTheDocument()

    const kpiSentiment = screen.getByText('Средний sentiment').closest('div')!.parentElement!
    expect(within(kpiSentiment).getByText('позитив')).toBeInTheDocument()
    // ru-RU decimal separator from CountUp's toLocaleString, + sign because
    // the sentiment is positive.
    expect(within(kpiSentiment).getByText('+0,42')).toBeInTheDocument()

    const kpiTopics = screen.getByText('Топиков').closest('div')!.parentElement!
    // 5 positive + 2 negative = 7 distinct (no overlap).
    expect(within(kpiTopics).getByText('7')).toBeInTheDocument()

    const kpiPositive = screen.getByText('Позитив').closest('div')!.parentElement!
    // pos=57, neg=13, share = round(57/70 * 100) = 81%.
    expect(within(kpiPositive).getByText('81%')).toBeInTheDocument()

    // top topics cards + top-5 list both reference positive topic names,
    // so use getAllByText for those.
    expect(screen.getByText('Позитивные')).toBeInTheDocument()
    expect(screen.getByText('Негативные')).toBeInTheDocument()
    expect(screen.getAllByText('Скорость подачи').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Дружелюбный персонал').length).toBeGreaterThanOrEqual(2)
    // Negative topics only render in the negative card.
    expect(screen.getByText('Медленный счёт')).toBeInTheDocument()

    // Top-5 section header
    expect(screen.getByText('Топ-5 топиков · позитив')).toBeInTheDocument()
  })

  it('renders error state on failure with retry', async () => {
    fetchOverview.mockRejectedValueOnce(new Error('network down'))
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardRoute />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
  })

  it('formats neutral sentiment when avg is null', async () => {
    fetchOverview.mockResolvedValueOnce(
      makeOverview({ avg_sentiment: null, top_positive_topics: [], top_negative_topics: [] }),
    )
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardRoute />
      </MemoryRouter>,
    )
    // sentiment value AND delta both render "—" — wait for the KPI to settle.
    await waitFor(() => expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2))
    // empty top topics → "Нет данных" placeholder in both pos and neg cards.
    expect(screen.getAllByText('Нет данных').length).toBeGreaterThanOrEqual(2)
  })
})
