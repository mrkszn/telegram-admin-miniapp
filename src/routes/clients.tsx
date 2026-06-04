import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_NAV } from './nav'

export function ClientsRoute() {
  return (
    <AppShell title="Клиенты" navItems={ADMIN_NAV}>
      <p className="text-sm text-muted">TODO — semantic search + deep-dive land in 4C #5.</p>
    </AppShell>
  )
}
