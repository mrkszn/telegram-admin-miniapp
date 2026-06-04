import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_NAV } from './nav'

export function MetricsRoute() {
  return (
    <AppShell title="Метрики" navItems={ADMIN_NAV}>
      <p className="text-sm text-muted">TODO — metric picker + chart land in 4C #3.</p>
    </AppShell>
  )
}
