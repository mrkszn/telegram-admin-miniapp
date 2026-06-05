import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DateRangeChips } from '@/components/filters/DateRangeChips'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { AnimatedBar } from '@/components/feedback/AnimatedBar'
import { CountUp } from '@/components/feedback/CountUp'
import { useApi } from '@/lib/hooks/useApi'
import { resolveRange, DEFAULT_PRESET, type DateRangePreset } from '@/lib/date-range'
import { fetchTopics } from '@/lib/api/admin'
import { cn } from '@/lib/utils'
import type { TopicCount, TopicSentiment, TopicsResponse } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

export function TopicsRoute() {
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET)
  const [tone, setTone] = useState<TopicSentiment>('positive')

  const range = useMemo(() => resolveRange(preset), [preset])
  const key = `topics|${tone}|${range.date_from}|${range.date_to}`

  const { data, error, isLoading, refetch } = useApi<TopicsResponse>(key, () =>
    fetchTopics({
      sentiment: tone,
      date_from: range.date_from,
      date_to: range.date_to,
    }),
  )

  return (
    <AppShell title="Топики" navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        <DateRangeChips value={preset} onChange={setPreset} />

        <Tabs value={tone} onValueChange={(v) => setTone(v as TopicSentiment)}>
          <TabsList>
            <TabsTrigger value="positive">Позитивные</TabsTrigger>
            <TabsTrigger value="negative">Негативные</TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <TopicsSkeleton />
        ) : (
          <TopicsContent topics={data.topics} tone={tone} />
        )}

        <MentionsPlaceholder />
      </div>
    </AppShell>
  )
}

function TopicsContent({
  topics,
  tone,
}: {
  topics: TopicCount[]
  tone: TopicSentiment
}) {
  const top5 = topics.slice(0, 5)
  return (
    <>
      <TopBars topics={top5} tone={tone} />
      <TopTable topics={top5} />
    </>
  )
}

function TopBars({
  topics,
  tone,
}: {
  topics: TopicCount[]
  tone: TopicSentiment
}) {
  const max = topics[0]?.count ?? 0
  const barColor = tone === 'positive' ? 'bg-success' : 'bg-danger'
  return (
    <section
      aria-label="Топ-5 топиков"
      className="card-shell flex flex-col gap-3"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Топ-5 · {tone === 'positive' ? 'позитив' : 'негатив'}
      </span>
      {topics.length === 0 ? (
        <span className="text-sm text-muted">За период данных нет.</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" data-testid="topic-bars">
          {topics.map((t, i) => {
            const pct = max > 0 ? (t.count / max) * 100 : 0
            return (
              <li
                key={`${tone}|${t.topic}`}
                className="flex animate-fade-rise items-center gap-2.5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="serif-num w-5 text-[15px] text-muted-2">{i + 1}</span>
                <span className="flex-[0_0_38%] truncate text-[13.5px] text-ink">{t.topic}</span>
                <AnimatedBar
                  pct={pct}
                  className={barColor}
                  wrapperClassName="flex-1"
                  delayMs={120 + i * 80}
                  label={`${t.topic}: ${t.count}`}
                />
                <span className="w-[30px] text-right font-mono text-[13px] font-medium text-ink">
                  <CountUp to={t.count} delayMs={150 + i * 80} durationMs={650} />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function TopTable({ topics }: { topics: TopicCount[] }) {
  if (topics.length === 0) return null
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center bg-surface-2 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        <span className="flex-1">Топик</span>
        <span className="w-[70px] text-right">Sentiment</span>
        <span className="w-[46px] text-right">Кол-во</span>
      </div>
      {topics.map((t, i) => {
        const positive = t.avg_sentiment >= 0
        return (
          <div
            key={t.topic}
            className="flex animate-fade-rise items-center border-t border-line px-3.5 py-3"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="flex-1 truncate text-sm font-medium text-ink">{t.topic}</span>
            <span
              className={cn(
                'w-[70px] text-right font-mono text-[13px] font-medium',
                positive ? 'text-success' : 'text-danger',
              )}
            >
              <CountUp
                to={t.avg_sentiment}
                durationMs={650}
                delayMs={100 + i * 50}
                fractionDigits={2}
                prefix={positive ? '+' : ''}
              />
            </span>
            <span className="w-[46px] text-right font-mono text-[13px] font-medium text-muted">
              <CountUp to={t.count} delayMs={120 + i * 50} durationMs={600} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MentionsPlaceholder() {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-baseline gap-2">
        <span className="serif-num text-base text-muted-2">01</span>
        <h2 className="font-serif text-lg">Упоминания</h2>
      </header>
      <div className="card-shell flex items-start gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-serif text-lg leading-tight text-ink">
            Следующая итерация
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Подключение к семантическому поиску по топикам — в следующем релизе.
            Пока используйте «Клиенты» и «Чат».
          </p>
        </div>
      </div>
    </section>
  )
}

function TopicsSkeleton() {
  return (
    <>
      <Skeleton className="h-[220px]" />
      <Skeleton className="h-[200px]" />
    </>
  )
}
