/**
 * LandingRouter cold-vs-warm split:
 *  - Fresh WebView (no session marker)  → renders ChatRoute
 *  - Warm restart  (marker present)     → Navigate to remembered tab
 *
 * sessionStorage / localStorage are jsdom-backed; setting / clearing them
 * directly between tests gives us deterministic control over the marker.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@/lib/api/admin', () => ({
  askAdmin: vi.fn(),
}))

vi.mock('@/lib/telegram/auth', () => ({
  bootstrapAuth: vi.fn(),
}))

const { LandingRouter } = await import('@/routes/landing')
const { useChatStore } = await import('@/lib/state/chat-store')

beforeEach(() => {
  sessionStorage.clear()
  localStorage.removeItem('mini_app.ui.last_tab')
  useChatStore.getState().clearChat()
})

describe('LandingRouter', () => {
  it('cold start (no session marker) renders chat landing and sets the marker', () => {
    localStorage.setItem('mini_app.ui.last_tab', '/metrics')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingRouter />} />
          <Route path="/metrics" element={<div>METRICS</div>} />
        </Routes>
      </MemoryRouter>,
    )
    // Chat empty-state title from i18n — confirms ChatRoute mounted.
    expect(screen.getByText('Спитай про feedback.')).toBeInTheDocument()
    expect(sessionStorage.getItem('mini_app.session.open')).toBe('1')
  })

  it('warm restart (marker present + last tab remembered) redirects to last tab', () => {
    sessionStorage.setItem('mini_app.session.open', '1')
    localStorage.setItem('mini_app.ui.last_tab', '/metrics')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingRouter />} />
          <Route path="/metrics" element={<div>METRICS</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('METRICS')).toBeInTheDocument()
  })

  it('warm restart with no last tab falls through to chat', () => {
    sessionStorage.setItem('mini_app.session.open', '1')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingRouter />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Спитай про feedback.')).toBeInTheDocument()
  })
})
