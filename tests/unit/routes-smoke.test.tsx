/**
 * Smoke: each admin route renders its AppShell title + the drawer hamburger
 * trigger. Guards against accidental router/import breakage when adding
 * wiring later. After the InsightFlow redesign the 5-slot BottomNav is gone —
 * every screen exposes the menu via a single hamburger button in the header.
 */
import type { ReactElement } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChatRoute } from '@/routes/chat'
import { DashboardRoute } from '@/routes/dashboard'
import { MetricsRoute } from '@/routes/metrics'
import { TopicsRoute } from '@/routes/topics'
import { ClientsRoute } from '@/routes/clients'
import { PrizesRoute } from '@/routes/prizes'

const cases: Array<{ path: string; title: string; Component: () => ReactElement }> = [
  { path: '/', title: 'Чат', Component: ChatRoute },
  { path: '/dashboard', title: 'Зведення', Component: DashboardRoute },
  { path: '/metrics', title: 'Метрики', Component: MetricsRoute },
  { path: '/topics', title: 'Теми', Component: TopicsRoute },
  { path: '/clients', title: 'Клієнти', Component: ClientsRoute },
  { path: '/prizes', title: 'Призи', Component: PrizesRoute },
]

describe('admin route smoke', () => {
  for (const { path, title, Component } of cases) {
    it(`${path} renders title + drawer trigger`, () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Component />
        </MemoryRouter>,
      )
      // Scope to level-1: some routes (Prizes placeholder) duplicate the
      // title inside their empty-state H2, so a bare role+name lookup picks
      // both elements and throws "found multiple".
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
      // The hamburger trigger lives in the header — its aria-label is the
      // "Menu" string from i18n, so the assertion follows the active locale.
      expect(screen.getByRole('button', { name: 'Меню' })).toBeInTheDocument()
    })
  }
})
