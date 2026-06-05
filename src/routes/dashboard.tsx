import { useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { DateRangeChips } from '@/components/filters/DateRangeChips'
import { KPICard } from '@/components/kpi/KPICard'
import { TopTopicsCard } from '@/components/topics/TopTopicsCard'
import { TopTopicsList } from '@/components/topics/TopTopicsList'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { CountUp } from '@/components/feedback/CountUp'
import { useApi } from '@/lib/hooks/useApi'
import { resolveRange, DEFAULT_PRESET, type DateRangePreset } from '@/lib/date-range'
import { fetchOverview } from '@/lib/api/admin'
import type { OverviewResponse } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

/* ── formatters ─────────────────────────────────────────── */

function sentimentLabel(v: number | null): string {
  if (v == null) return '—'
  if (v > 0.33) return 'позитив'
  if (v < -0.33) return 'негатив'
  return 'нейтрально'
}

function sentimentDeltaKind(v: number | null): 'positive' | 'negative' | 'neutral' {
  if (v == null) return 'neutral'
  if (v > 0.33) return 'positive'
  if (v < -0.33) return 'negative'
  return 'neutral'
}

function positiveSharePct(o: OverviewResponse): string {
  const pos = o.top_positive_topics.reduce((s, t) => s + t.count, 0)
  const neg = o.top_negative_topics.reduce((s, t) => s + t.count, 0)
  const total = pos + neg
  if (total === 0) return '—'
  return `${Math.round((pos / total) * 100)}%`
}

function positiveShareNumber(o: OverviewResponse): number | null {
  const pos = o.top_positive_topics.reduce((s, t) => s + t.count, 0)
  const neg = o.top_negative_topics.reduce((s, t) => s + t.count, 0)
  const total = pos + neg
  if (total === 0) return null
  return Math.round((pos / total) * 100)
}

function uniqueTopicsCount(o: OverviewResponse): number {
  const set = new Set<string>()
  for (const t of o.top_positive_topics) set.add(t.topic)
  for (const t of o.top_negative_topics) set.add(t.topic)
  return set.size
}

/* ── route ──────────────────────────────────────────────── */

export function DashboardRoute() {
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET)
  const range = useMemo(() => resolveRange(preset), [preset])
  const key = `overview|${range.date_from}|${range.date_to}`

  const { data, error, isLoading, refetch } = useApi<OverviewResponse>(key, () =>
    fetchOverview({ date_from: range.date_from, date_to: range.date_to }),
  )

  return (
    <AppShell title="Сводка" navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        <DateRangeChips value={preset} onChange={setPreset} />

        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <DashboardSkeleton />
        ) : (
          <DashboardContent overview={data} />
        )}
      </div>
    </AppShell>
  )
}

/* ── content ────────────────────────────────────────────── */

function DashboardContent({ overview }: { overview: OverviewResponse }) {
  const positiveCount = overview.top_positive_topics.reduce((s, t) => s + t.count, 0)
  const negativeCount = overview.top_negative_topics.reduce((s, t) => s + t.count, 0)
  const totalMentions = positiveCount + negativeCount
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <KPICard
          label="Сессий"
          value={<CountUp to={overview.sessions_count} durationMs={900} />}
          caption="за период"
        />
        <KPICard
          label="Средний sentiment"
          value={sentimentLabel(overview.avg_sentiment)}
          delta={
            overview.avg_sentiment != null ? (
              <CountUp
                to={overview.avg_sentiment}
                durationMs={900}
                delayMs={120}
                fractionDigits={2}
                prefix={overview.avg_sentiment > 0 ? '+' : ''}
              />
            ) : (
              '—'
            )
          }
          deltaKind={sentimentDeltaKind(overview.avg_sentiment)}
        />
        <KPICard
          label="Топиков"
          value={<CountUp to={uniqueTopicsCount(overview)} durationMs={900} delayMs={150} />}
          caption="уникальных"
        />
        <KPICard
          label="Позитив"
          value={
            positiveShareNumber(overview) != null ? (
              <CountUp
                to={positiveShareNumber(overview)!}
                durationMs={900}
                delayMs={200}
                suffix="%"
              />
            ) : (
              positiveSharePct(overview)
            )
          }
          caption={totalMentions > 0 ? `${positiveCount} из ${totalMentions}` : 'доля'}
          deltaKind={positiveCount >= negativeCount ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <TopTopicsCard
          title="Позитивные"
          tone="positive"
          topics={overview.top_positive_topics}
        />
        <TopTopicsCard
          title="Негативные"
          tone="negative"
          topics={overview.top_negative_topics}
        />
      </div>

      <section className="flex flex-col gap-2.5">
        <header className="flex items-baseline gap-2">
          <span className="serif-num text-base text-muted-2">01</span>
          <h2 className="font-serif text-lg">Топ-5 топиков · позитив</h2>
        </header>
        <TopTopicsList topics={overview.top_positive_topics} tone="positive" limit={5} />
      </section>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[130px]" />
        <Skeleton className="h-[130px]" />
      </div>
      <Skeleton className="h-[240px]" />
    </>
  )
}
