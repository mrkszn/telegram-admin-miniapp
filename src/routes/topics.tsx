import { useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { DateRangeChips } from '@/components/filters/DateRangeChips'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { AnimatedBar } from '@/components/feedback/AnimatedBar'
import { CountUp } from '@/components/feedback/CountUp'
import { ClientListSheet } from '@/components/clients/ClientListSheet'
import { AskAiCta } from '@/components/chat/AskAiCta'
import { useApi } from '@/lib/hooks/useApi'
import { usePersistentState } from '@/lib/hooks/usePersistentState'
import {
  resolveSelection,
  formatRangeLabel,
  DEFAULT_SELECTION,
  isDateRangeSelection,
  type DateRangeSelection,
} from '@/lib/date-range'
import { fetchTopics, fetchTopicClients, type DateRange } from '@/lib/api/admin'
import { cn } from '@/lib/utils'
import { useT, useLanguage } from '@/lib/i18n'
import type { TopicCount, TopicSentiment, TopicsResponse } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

export function TopicsRoute() {
  const t = useT()
  const lang = useLanguage()
  const [selection, setSelection] = usePersistentState<DateRangeSelection>(
    'period_v2',
    DEFAULT_SELECTION,
    isDateRangeSelection,
  )
  const [tone, setTone] = usePersistentState<TopicSentiment>(
    'topics_tone',
    'positive',
    (v): v is TopicSentiment => v === 'positive' || v === 'negative',
  )

  const range = useMemo(() => resolveSelection(selection), [selection])
  const key = `topics|${tone}|${range.date_from}|${range.date_to}`

  const { data, error, isLoading, refetch } = useApi<TopicsResponse>(key, () =>
    fetchTopics({
      sentiment: tone,
      date_from: range.date_from,
      date_to: range.date_to,
    }),
  )

  const top5 = data?.topics.slice(0, 5) ?? []
  const periodLabel = formatRangeLabel(selection, t, lang)
  const askAiQuestion = t('askAi.topicsList', {
    tone: t(tone === 'positive' ? 'askAi.tone.positive' : 'askAi.tone.negative'),
    period: periodLabel,
    topics: top5.map((tc) => tc.topic).join(', ') || '—',
  })

  return (
    <AppShell title={t('title.topics')} navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        <DateRangeChips value={selection} onChange={setSelection} />

        <Tabs value={tone} onValueChange={(v) => setTone(v as TopicSentiment)}>
          <TabsList>
            <TabsTrigger value="positive">{t('topics.tab.positive')}</TabsTrigger>
            <TabsTrigger value="negative">{t('topics.tab.negative')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {top5.length > 0 ? <AskAiCta question={askAiQuestion} /> : null}

        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <TopicsSkeleton />
        ) : (
          <TopicsContent
            topics={data.topics}
            tone={tone}
            range={{ date_from: range.date_from, date_to: range.date_to }}
          />
        )}
      </div>
    </AppShell>
  )
}

function TopicsContent({
  topics,
  tone,
  range,
}: {
  topics: TopicCount[]
  tone: TopicSentiment
  range: DateRange
}) {
  const t = useT()
  const top5 = topics.slice(0, 5)
  const [topic, setTopic] = useState<string | null>(null)
  return (
    <>
      <TopBars topics={top5} tone={tone} onPickTopic={setTopic} />
      <TopTable topics={top5} onPickTopic={setTopic} />

      <ClientListSheet
        open={topic != null}
        onOpenChange={(o) => {
          if (!o) setTopic(null)
        }}
        title={topic ?? ''}
        description={t('clients.byTopic')}
        fetchKey={`${topic ?? ''}|${range.date_from}|${range.date_to}`}
        fetcher={() => fetchTopicClients(topic ?? '', range)}
      />
    </>
  )
}

function TopBars({
  topics,
  tone,
  onPickTopic,
}: {
  topics: TopicCount[]
  tone: TopicSentiment
  onPickTopic(topic: string): void
}) {
  const t = useT()
  const max = topics[0]?.count ?? 0
  const barColor = tone === 'positive' ? 'bg-success' : 'bg-danger'
  return (
    <section
      aria-label={t('topics.top5.aria')}
      className="card-shell flex flex-col gap-3"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {tone === 'positive' ? t('topics.top5.positive') : t('topics.top5.negative')}
      </span>
      {topics.length === 0 ? (
        <span className="text-sm text-muted">{t('topics.noDataPeriod')}</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" data-testid="topic-bars">
          {topics.map((tc, i) => {
            const pct = max > 0 ? (tc.count / max) * 100 : 0
            return (
              <li
                key={`${tone}|${tc.topic}`}
                className="animate-fade-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button
                  type="button"
                  onClick={() => onPickTopic(tc.topic)}
                  className="flex w-full items-center gap-2.5 rounded-tag text-left transition-colors hover:bg-surface-2"
                >
                  <span className="serif-num w-5 text-[15px] text-muted-2">{i + 1}</span>
                  <span className="flex-[0_0_38%] truncate text-[13.5px] text-ink">{tc.topic}</span>
                  <AnimatedBar
                    pct={pct}
                    className={barColor}
                    wrapperClassName="flex-1"
                    delayMs={120 + i * 80}
                    label={`${tc.topic}: ${tc.count}`}
                  />
                  <span className="w-[30px] text-right font-mono text-[13px] font-medium text-ink">
                    <CountUp to={tc.count} delayMs={150 + i * 80} durationMs={650} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function TopTable({
  topics,
  onPickTopic,
}: {
  topics: TopicCount[]
  onPickTopic(topic: string): void
}) {
  const t = useT()
  if (topics.length === 0) return null
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center bg-surface-2 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        <span className="flex-1">{t('topics.table.topic')}</span>
        <span className="w-[70px] text-right">{t('topics.table.sentiment')}</span>
        <span className="w-[46px] text-right">{t('topics.table.count')}</span>
      </div>
      {topics.map((tc, i) => {
        const positive = tc.avg_sentiment >= 0
        return (
          <button
            key={tc.topic}
            type="button"
            onClick={() => onPickTopic(tc.topic)}
            className="flex w-full animate-fade-rise items-center border-t border-line px-3.5 py-3 text-left transition-colors hover:bg-surface-2"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="flex-1 truncate text-sm font-medium text-ink">{tc.topic}</span>
            <span
              className={cn(
                'w-[70px] text-right font-mono text-[13px] font-medium',
                positive ? 'text-success' : 'text-danger',
              )}
            >
              <CountUp
                to={tc.avg_sentiment}
                durationMs={650}
                delayMs={100 + i * 50}
                fractionDigits={2}
                prefix={positive ? '+' : ''}
              />
            </span>
            <span className="w-[46px] text-right font-mono text-[13px] font-medium text-muted">
              <CountUp to={tc.count} delayMs={120 + i * 50} durationMs={600} />
            </span>
          </button>
        )
      })}
    </div>
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
