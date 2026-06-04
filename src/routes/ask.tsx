import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_NAV } from './nav'

export function AskRoute() {
  return (
    <AppShell title="Чат" navItems={ADMIN_NAV}>
      <p className="text-sm text-muted">TODO — wire ChatWidget to /admin/ask in 4C #6.</p>
    </AppShell>
  )
}
