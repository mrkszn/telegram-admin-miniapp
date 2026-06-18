/**
 * /dashboard drill-downs: the "Sessions" KPI opens a sessions sheet and a
 * tap on a session navigates to its timeline route.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { OverviewResponse, SessionsResponse } from '@/lib/api/types'

const fetchOverview = vi.fn<(args: unknown) => Promise<OverviewResponse>>()
const fetchSessions = vi.fn<(args: unknown) => Promise<SessionsResponse>>()
const fetchTopicClients = vi.fn()
const fetchClientProfile = vi.fn()

vi.mock('@/lib/api/admin', () => ({
  fetchOverview: (args: unknown) => fetchOverview(args),
  fetchSessions: (args: unknown) => fetchSessions(args),
  fetchTopicClients: () => fetchTopicClients(),
  fetchClientProfile: () => fetchClientProfile(),
}))

const { DashboardRoute } = await import('@/routes/dashboard')

const overview: OverviewResponse = {
  sessions_count: 12,
  avg_sentiment: 0.2,
  top_positive_topics: [{ topic: 'сервіс', count: 4, avg_sentiment: 0.5 }],
  top_negative_topics: [{ topic: 'черга', count: 2, avg_sentiment: -0.5 }],
}

const sessions: SessionsResponse = {
  sessions: [
    {
      id: 's-1',
      client_id: 42,
      client_name: 'Bob',
      started_at: '2026-05-30T18:21:00Z',
      ended_at: null,
      sentiment: 'negative',
      topics: ['черга'],
      source: 'telegram',
    },
  ],
}

beforeEach(() => {
  fetchOverview.mockReset()
  fetchSessions.mockReset()
})

describe('DashboardRoute drill-down', () => {
  it('opens the sessions sheet and navigates to a session timeline', async () => {
    fetchOverview.mockResolvedValue(overview)
    fetchSessions.mockResolvedValue(sessions)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/sessions/:id" element={<div>timeline page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => expect(fetchOverview).toHaveBeenCalled())

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Переглянути сесії' }))

    await waitFor(() => expect(fetchSessions).toHaveBeenCalled())
    // sentiment passed should be undefined for the all-sessions KPI
    expect(fetchSessions.mock.calls[0]?.[0]).not.toHaveProperty('sentiment')

    const row = await screen.findByText('Bob')
    await user.click(row)

    expect(await screen.findByText('timeline page')).toBeInTheDocument()
  })

  it('opens negative sessions from the "Negative" card with sentiment=negative', async () => {
    fetchOverview.mockResolvedValue(overview)
    fetchSessions.mockResolvedValue(sessions)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardRoute />
      </MemoryRouter>,
    )
    await waitFor(() => expect(fetchOverview).toHaveBeenCalled())

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Переглянути негативні сесії' }),
    )

    await waitFor(() => expect(fetchSessions).toHaveBeenCalled())
    expect(fetchSessions.mock.calls[0]?.[0]).toMatchObject({ sentiment: 'negative' })
  })
})
