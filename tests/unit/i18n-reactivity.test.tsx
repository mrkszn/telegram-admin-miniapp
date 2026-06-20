/**
 * Smoke test for the language-switch contract: a mounted screen must swap
 * every translated string the instant `setLanguage()` flips, no re-mount
 * needed. Guards against accidental capture of translated strings outside
 * the React render (e.g. module-level constants, `useState(t(...))`).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useT, setLanguage, useLanguage } from '@/lib/i18n'

function Probe() {
  const t = useT()
  const lang = useLanguage()
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="back">{t('header.back')}</span>
      <span data-testid="sentiment">{t('clients.profile.sentiment')}</span>
      <span data-testid="chart-loading">{t('chart.loading')}</span>
      <span data-testid="dashboard-top5">{t('dashboard.top5')}</span>
      <span data-testid="metric-nps">{t('metricKey.nps')}</span>
      <span data-testid="metric-service-speed">{t('metricKey.service_speed')}</span>
    </div>
  )
}

beforeEach(() => {
  setLanguage('uk')
})

describe('useT reactivity', () => {
  it('re-translates every key in place when setLanguage flips', () => {
    render(<Probe />)
    expect(screen.getByTestId('lang')).toHaveTextContent('uk')
    expect(screen.getByTestId('back')).toHaveTextContent('Назад')
    expect(screen.getByTestId('chart-loading')).toHaveTextContent('Завантаження графіка')
    expect(screen.getByTestId('dashboard-top5')).toHaveTextContent('Топ-5 тем · позитив')
    expect(screen.getByTestId('metric-service-speed')).toHaveTextContent('Швидкість сервісу')

    act(() => setLanguage('en'))

    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(screen.getByTestId('back')).toHaveTextContent('Back')
    expect(screen.getByTestId('chart-loading')).toHaveTextContent('Chart loading')
    expect(screen.getByTestId('dashboard-top5')).toHaveTextContent('Top 5 topics · positive')
    expect(screen.getByTestId('metric-service-speed')).toHaveTextContent('Service speed')
  })
})
