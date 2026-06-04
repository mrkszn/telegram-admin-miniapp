import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_NAV } from './nav'

export function DashboardRoute() {
  return (
    <AppShell title="Сводка" navItems={ADMIN_NAV}>
      <p className="text-sm text-muted">TODO — KPI overview wiring lands in 4C #2.</p>
    </AppShell>
  )
}
