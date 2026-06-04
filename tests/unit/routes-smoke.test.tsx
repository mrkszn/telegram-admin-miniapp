/**
 * Smoke: each admin route renders its AppShell title + 5-slot BottomNav.
 * Guards against accidental router/import breakage when adding wiring later.
 */
import type { ReactElement } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardRoute } from '@/routes/dashboard'
import { MetricsRoute } from '@/routes/metrics'
import { TopicsRoute } from '@/routes/topics'
import { ClientsRoute } from '@/routes/clients'
import { AskRoute } from '@/routes/ask'

const cases: Array<{ name: string; title: string; Component: () => ReactElement }> = [
  { name: 'dashboard', title: 'Сводка', Component: DashboardRoute },
  { name: 'metrics', title: 'Метрики', Component: MetricsRoute },
  { name: 'topics', title: 'Топики', Component: TopicsRoute },
  { name: 'clients', title: 'Клиенты', Component: ClientsRoute },
  { name: 'ask', title: 'Чат', Component: AskRoute },
]

describe('admin route smoke', () => {
  for (const { name, title, Component } of cases) {
    it(`${name} renders title + nav`, () => {
      render(
        <MemoryRouter initialEntries={[`/${name}`]}>
          <Component />
        </MemoryRouter>,
      )
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      // 5-slot BottomNav (Главная / Метрики / Топики / Клиенты / Чат).
      const nav = screen.getByRole('navigation', { name: 'Основная навигация' })
      expect(nav).toBeInTheDocument()
      // Scope the label lookup to the nav so the header title can reuse the
      // same word (e.g. /metrics — title "Метрики" + nav slot "Метрики").
      const inNav = within(nav)
      for (const label of ['Главная', 'Метрики', 'Топики', 'Клиенты', 'Чат']) {
        expect(inNav.getByText(label)).toBeInTheDocument()
      }
    })
  }
})
