import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_NAV } from './nav'

export function TopicsRoute() {
  return (
    <AppShell title="Топики" navItems={ADMIN_NAV}>
      <p className="text-sm text-muted">TODO — positive / negative tabs land in 4C #4.</p>
    </AppShell>
  )
}
