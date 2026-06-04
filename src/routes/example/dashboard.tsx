import { LayoutDashboard, BarChart3, MessageCircle, Settings } from 'lucide-react'
import { AppShell, type NavItem } from '@/components/layout/AppShell'
import { KPICard } from '@/components/kpi/KPICard'
import { LineChartCard } from '@/components/charts/LineChartCard'

const NAV_ITEMS: NavItem[] = [
  { to: '/example/dashboard', label: 'Сводка', icon: LayoutDashboard, end: true },
  { to: '/example/metrics', label: 'Метрики', icon: BarChart3 },
  { to: '/example/chat', label: 'Чат', icon: MessageCircle },
  { to: '/example/settings', label: 'Настройки', icon: Settings },
]

interface KpiSeed {
  label: string
  value: string
  caption: string
  delta: string
  deltaKind: 'positive' | 'negative' | 'neutral'
}

const KPIS: KpiSeed[] = [
  { label: 'Active users', value: '1 248', caption: 'Last 7 days', delta: '+8.2%', deltaKind: 'positive' },
  { label: 'Avg session', value: '4m 12s', caption: 'Last 7 days', delta: '+0.4%', deltaKind: 'positive' },
  { label: 'Topics', value: '37', caption: 'Open', delta: '−2', deltaKind: 'negative' },
  { label: 'Reply rate', value: '92%', caption: 'Last 7 days', delta: '+1.1%', deltaKind: 'positive' },
]

const TREND = [
  { day: 'Пн', Active: 920, Sessions: 1810 },
  { day: 'Вт', Active: 1010, Sessions: 1980 },
  { day: 'Ср', Active: 1184, Sessions: 2140 },
  { day: 'Чт', Active: 1090, Sessions: 2050 },
  { day: 'Пт', Active: 1248, Sessions: 2380 },
  { day: 'Сб', Active: 980, Sessions: 1720 },
  { day: 'Вс', Active: 860, Sessions: 1490 },
]

export function ExampleDashboard() {
  return (
    <AppShell title="Сводка" navItems={NAV_ITEMS}>
      <div className="flex flex-col gap-4">
        <section className="grid grid-cols-2 gap-3">
          {KPIS.map((k) => (
            <KPICard
              key={k.label}
              label={k.label}
              value={k.value}
              caption={k.caption}
              delta={k.delta}
              deltaKind={k.deltaKind}
            />
          ))}
        </section>
        <LineChartCard
          title="Активность"
          subtitle="Последние 7 дней"
          data={TREND}
          index="day"
          categories={['Active', 'Sessions']}
          valueFormatter={(n) => Intl.NumberFormat('ru-RU').format(n)}
        />
      </div>
    </AppShell>
  )
}
