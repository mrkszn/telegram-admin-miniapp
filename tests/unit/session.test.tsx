/**
 * Session timeline route (/sessions/:id) — renders the transcript, the
 * answers and the summary from GET /admin/sessions/{id}.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { SessionDetail } from '@/lib/api/types'

const fetchSessionDetail = vi.fn<(id: string) => Promise<SessionDetail>>()

vi.mock('@/lib/api/admin', () => ({
  fetchSessionDetail: (id: string) => fetchSessionDetail(id),
}))

const { SessionRoute } = await import('@/routes/session')

const sample: SessionDetail = {
  id: 's-1',
  client_id: 42,
  client_name: 'Alice Cooper',
  started_at: '2026-05-30T18:21:00Z',
  ended_at: '2026-05-30T18:35:00Z',
  sentiment: 'positive',
  topics: ['сервіс', 'їжа'],
  source: 'telegram',
  summary: 'Клієнт задоволений сервісом.',
  messages: [
    { role: 'assistant', content: 'Як вам сьогоднішній візит?', created_at: '2026-05-30T18:21:00Z' },
    { role: 'user', content: 'Все було чудово!', created_at: '2026-05-30T18:22:00Z' },
  ],
  answers: [
    { question_text: 'Оцініть сервіс', answer_text: 'Відмінно', marked_value: '5' },
  ],
  card_summary: 'ok',
  journey: null,
}

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/sessions/${id}`]}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionRoute />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchSessionDetail.mockReset()
})

describe('SessionRoute', () => {
  it('fetches by id and renders summary, answers and transcript', async () => {
    fetchSessionDetail.mockResolvedValueOnce(sample)
    renderAt('s-1')

    expect(await screen.findByText('Alice Cooper')).toBeInTheDocument()
    expect(fetchSessionDetail).toHaveBeenCalledWith('s-1')

    // summary + answer
    expect(screen.getByText('Клієнт задоволений сервісом.')).toBeInTheDocument()
    expect(screen.getByText('Оцініть сервіс')).toBeInTheDocument()
    expect(screen.getByText('Відмінно')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // transcript messages
    const transcript = screen.getByTestId('session-transcript')
    expect(transcript).toBeInTheDocument()
    expect(screen.getByText('Як вам сьогоднішній візит?')).toBeInTheDocument()
    expect(screen.getByText('Все було чудово!')).toBeInTheDocument()
  })

  it('shows an error state with retry when the fetch fails', async () => {
    fetchSessionDetail.mockRejectedValueOnce({ status: 500, message: 'boom' })
    renderAt('s-1')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('renders the JourneyRibbon above the transcript for web sessions', async () => {
    fetchSessionDetail.mockResolvedValueOnce({
      ...sample,
      source: 'web',
      messages: [],
      journey: {
        mode: 'targeted',
        meal_occasion: 'dinner',
        beats: [
          {
            label_uk: 'Заход',
            emoji: '🚪',
            score: 4,
            transcription_uk: 'Привітали швидко',
            tags: ['швидко'],
          },
          {
            label_uk: 'Їжа',
            emoji: '🍝',
            score: null,
            transcription_uk: null,
            tags: [],
          },
        ],
      },
    })
    renderAt('s-1')

    expect(await screen.findByText('Alice Cooper')).toBeInTheDocument()
    expect(screen.getByText('Гейміфікація')).toBeInTheDocument()
    expect(screen.getByText(/Візит: вечеря/)).toBeInTheDocument()
    expect(screen.getByText('Заход')).toBeInTheDocument()
    expect(screen.getByText('4/5')).toBeInTheDocument()
    expect(screen.getByText('Привітали швидко')).toBeInTheDocument()
    expect(screen.getByText('швидко')).toBeInTheDocument()
    // missing-score beat falls back to the em-dash
    expect(screen.getByText('Їжа')).toBeInTheDocument()
  })

  it('renders an object-valued marked_value without crashing (regression: React #31)', async () => {
    fetchSessionDetail.mockResolvedValueOnce({
      ...sample,
      // backend types marked_value as `Any` — real data can be an object
      answers: [
        {
          question_text: 'Оцініть сервіс',
          answer_text: 'Відмінно',
          marked_value: { value: 'Більше року' } as unknown as string,
        },
      ],
    })
    renderAt('s-1')

    expect(await screen.findByText('Alice Cooper')).toBeInTheDocument()
    // the inner scalar is unwrapped and shown, no error boundary
    expect(screen.getByText('Більше року')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
