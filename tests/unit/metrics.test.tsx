/**
 * /metrics wiring — mocks fetchMetrics and asserts that the conditional
 * branches (number vs enum vs text vs unknown) render the right widgets.
 *
 * Tremor renders the chart inside a <ResponsiveContainer/> which needs
 * actual size — we don't assert chart pixels, just the card frame
 * (title / subtitle) it ships in.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { MetricsResponse, QuestionsResponse } from '@/lib/api/types'

const fetchMetrics = vi.fn<(args: unknown) => Promise<MetricsResponse>>()
const fetchQuestions = vi.fn<() => Promise<QuestionsResponse>>()

// Default questions list — gives the picker a non-empty live key set
// so the route doesn't sit suspended waiting for /admin/questions.
fetchQuestions.mockResolvedValue({
  questions: [
    {
      id: 'q-rating',
      text: 'Оценка',
      metric_key: 'rating',
      expected_type: 'number',
      enum_values: null,
    },
    {
      id: 'q-would-return',
      text: 'Готовность вернуться',
      metric_key: 'would_return',
      expected_type: 'enum',
      enum_values: ['yes', 'maybe', 'no'],
    },
  ],
})

vi.mock('@/lib/api/admin', () => ({
  fetchMetrics: (args: unknown) => fetchMetrics(args),
  fetchQuestions: () => fetchQuestions(),
}))

const { MetricsRoute } = await import('@/routes/metrics')

function numberResponse(): MetricsResponse {
  return {
    metric_key: 'rating',
    expected_type: 'number',
    points: [
      { bucket: 'Пн', count: 28, avg: 4.2, min: 3, max: 5 },
      { bucket: 'Вт', count: 32, avg: 4.4, min: 4, max: 5 },
      { bucket: 'Ср', count: 41, avg: 4.5, min: 4, max: 5 },
    ],
    distribution: null,
    total: null,
    unknown: null,
    enum_values: null,
  }
}

function enumResponse(): MetricsResponse {
  return {
    metric_key: 'would_return',
    expected_type: 'enum',
    points: null,
    distribution: [
      { value: 'yes', count: 78, pct: 0.62 },
      { value: 'maybe', count: 30, pct: 0.24 },
      { value: 'no', count: 18, pct: 0.14 },
    ],
    total: 126,
    unknown: 4,
    enum_values: ['yes', 'maybe', 'no'],
  }
}

function textResponse(): MetricsResponse {
  return {
    metric_key: 'free_text',
    expected_type: 'text',
    points: null,
    distribution: null,
    total: null,
    unknown: null,
    enum_values: null,
  }
}

function unknownResponse(): MetricsResponse {
  return {
    metric_key: 'whatever',
    expected_type: 'unknown',
    points: null,
    distribution: null,
    total: null,
    unknown: null,
    enum_values: null,
  }
}

beforeEach(() => {
  fetchMetrics.mockReset()
})

describe('MetricsRoute', () => {
  it('renders the line chart card + per-day table for numeric metrics', async () => {
    fetchMetrics.mockResolvedValueOnce(numberResponse())
    render(
      <MemoryRouter initialEntries={['/metrics']}>
        <MetricsRoute />
      </MemoryRouter>,
    )
    await waitFor(() => expect(fetchMetrics).toHaveBeenCalled())
    expect(await screen.findByText(/Середнє за метрикою/)).toBeInTheDocument()
    expect(screen.getByText('Значення за днями')).toBeInTheDocument()
    // each bucket should appear in the table column
    expect(screen.getAllByText('Пн').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Ср').length).toBeGreaterThanOrEqual(1)
    // average value (avg = 4.20) appears in the table
    expect(screen.getByText('4.20')).toBeInTheDocument()
  })

  it('renders distribution + categories table for enum metrics', async () => {
    fetchMetrics.mockResolvedValueOnce(enumResponse())
    render(
      <MemoryRouter initialEntries={['/metrics']}>
        <MetricsRoute />
      </MemoryRouter>,
    )
    await waitFor(() => expect(fetchMetrics).toHaveBeenCalled())
    expect(await screen.findByText(/Розподіл за метрикою/)).toBeInTheDocument()
    expect(screen.getByText('Категорії')).toBeInTheDocument()
    // Total chip + "undefined" counter
    expect(screen.getAllByText('126').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Не визначено:')).toBeInTheDocument()
    // category rows
    expect(screen.getAllByText('yes').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the redirect hint for text metrics', async () => {
    fetchMetrics.mockResolvedValueOnce(textResponse())
    render(
      <MemoryRouter initialEntries={['/metrics']}>
        <MetricsRoute />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Текстова метрика/i)).toBeInTheDocument()
  })

  it('shows "not found" for unknown metrics', async () => {
    fetchMetrics.mockResolvedValueOnce(unknownResponse())
    render(
      <MemoryRouter initialEntries={['/metrics']}>
        <MetricsRoute />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/не знайдена/i)).toBeInTheDocument()
  })
})
