import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DateRangeChips } from '@/components/filters/DateRangeChips'
import { KPICard } from '@/components/kpi/KPICard'
import { TopTopicsCard } from '@/components/topics/TopTopicsCard'
import { TopTopicsList } from '@/components/topics/TopTopicsList'
import { TopicListSheet } from '@/components/topics/TopicListSheet'
import { SessionListSheet } from '@/components/sessions/SessionListSheet'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { CountUp } from '@/components/feedback/CountUp'
import { useApi } from '@/lib/hooks/useApi'
import { usePersistentState } from '@/lib/hooks/usePersistentState'
import {
  resolveSelection,
  formatRangeLabel,
  DEFAULT_SELECTION,
  isDateRangeSelection,
  type DateRangeSelection,
} from '@/lib/date-range'
import { fetchOverview, fetchSessions, type DateRange } from '@/lib/api/admin'
import { AskAiCta } from '@/components/chat/AskAiCta'
import { useT, useLanguage, type Translator } from '@/lib/i18n'
import type { OverviewResponse, SessionSentiment, TopicCount } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

/* ── formatters ─────────────────────────────────────────── */

function sentimentLabel(v: number | null, t: Translator): string {
  if (v == null) return '—'
  if (v > 0.33) return t('sentiment.positive')
  if (v < -0.33) return t('sentiment.negative')
  return t('sentiment.neutral')
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
  return mergedTopics(o).length
}

/** Positive + negative topics merged into one list, counts summed per topic. */
function mergedTopics(o: OverviewResponse): TopicCount[] {
  const byTopic = new Map<string, TopicCount>()
  for (const tc of [...o.top_positive_topics, ...o.top_negative_topics]) {
    const prev = byTopic.get(tc.topic)
    if (prev) prev.count += tc.count
    else byTopic.set(tc.topic, { ...tc })
  }
  return [...byTopic.values()].sort((a, b) => b.count - a.count)
}

/* ── route ──────────────────────────────────────────────── */

export function DashboardRoute() {
  const t = useT()
  const lang = useLanguage()
  const [selection, setSelection] = usePersistentState<DateRangeSelection>(
    'period_v2',
    DEFAULT_SELECTION,
    isDateRangeSelection,
  )
  const range = useMemo(() => resolveSelection(selection), [selection])
  const periodLabel = formatRangeLabel(selection, t, lang)
  const key = `overview|${range.date_from}|${range.date_to}`

  const { data, error, isLoading, refetch } = useApi<OverviewResponse>(key, () =>
    fetchOverview({ date_from: range.date_from, date_to: range.date_to }),
  )

  return (
    <AppShell title={t('title.dashboard')} navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        <DateRangeChips value={selection} onChange={setSelection} />

        <AskAiCta question={t('askAi.dashboard', { period: periodLabel })} />

        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <DashboardSkeleton />
        ) : (
          <DashboardContent overview={data} range={range} />
        )}
      </div>
    </AppShell>
  )
}

/* ── content ────────────────────────────────────────────── */

/** Which drill-down sheet is open, if any. */
type Drill =
  | { kind: 'sessions'; sentiment?: SessionSentiment }
  | { kind: 'topics' }
  | null

function DashboardContent({
  overview,
  range,
}: {
  overview: OverviewResponse
  range: DateRange
}) {
  const t = useT()
  const navigate = useNavigate()
  const [drill, setDrill] = useState<Drill>(null)

  const positiveCount = overview.top_positive_topics.reduce((s, tc) => s + tc.count, 0)
  const negativeCount = overview.top_negative_topics.reduce((s, tc) => s + tc.count, 0)
  const totalMentions = positiveCount + negativeCount
  const topics = useMemo(() => mergedTopics(overview), [overview])
  const dateRange: DateRange = { date_from: range.date_from, date_to: range.date_to }

  const closeDrill = useCallback(() => setDrill(null), [])
  const openSession = useCallback(
    (id: string) => {
      setDrill(null)
      navigate(`/sessions/${id}`)
    },
    [navigate],
  )

  const sessionsOpen = drill?.kind === 'sessions'
  const sessionSentiment = drill?.kind === 'sessions' ? drill.sentiment : undefined
  const sessionsTitle =
    sessionSentiment === 'positive'
      ? t('dashboard.cards.positive')
      : sessionSentiment === 'negative'
        ? t('dashboard.cards.negative')
        : t('dashboard.kpi.sessions')

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <KPICard
          label={t('dashboard.kpi.sessions')}
          value={<CountUp to={overview.sessions_count} durationMs={900} />}
          caption={t('dashboard.kpi.sessionsCaption')}
          onClick={() => setDrill({ kind: 'sessions' })}
          ariaLabel={t('dashboard.drill.sessions')}
        />
        <KPICard
          label={t('dashboard.kpi.avgSentiment')}
          value={sentimentLabel(overview.avg_sentiment, t)}
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
          label={t('dashboard.kpi.topics')}
          value={<CountUp to={uniqueTopicsCount(overview)} durationMs={900} delayMs={150} />}
          caption={t('dashboard.kpi.topicsCaption')}
          onClick={() => setDrill({ kind: 'topics' })}
          ariaLabel={t('dashboard.drill.topics')}
        />
        <KPICard
          label={t('dashboard.kpi.positive')}
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
          caption={
            totalMentions > 0
              ? t('dashboard.kpi.positiveCount', {
                  positive: positiveCount,
                  total: totalMentions,
                })
              : t('dashboard.kpi.positiveShare')
          }
          deltaKind={positiveCount >= negativeCount ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <TopTopicsCard
          title={t('dashboard.cards.positive')}
          tone="positive"
          topics={overview.top_positive_topics}
          onClick={() => setDrill({ kind: 'sessions', sentiment: 'positive' })}
          ariaLabel={t('dashboard.drill.positiveSessions')}
        />
        <TopTopicsCard
          title={t('dashboard.cards.negative')}
          tone="negative"
          topics={overview.top_negative_topics}
          onClick={() => setDrill({ kind: 'sessions', sentiment: 'negative' })}
          ariaLabel={t('dashboard.drill.negativeSessions')}
        />
      </div>

      <section className="flex flex-col gap-2.5">
        <header className="flex items-baseline gap-2">
          <span className="serif-num text-base text-muted-2">01</span>
          <h2 className="font-serif text-lg">{t('dashboard.top5')}</h2>
        </header>
        <TopTopicsList topics={overview.top_positive_topics} tone="positive" limit={5} />
      </section>

      <SessionListSheet
        open={sessionsOpen}
        onOpenChange={(o) => {
          if (!o) closeDrill()
        }}
        title={sessionsTitle}
        fetchKey={`sessions|${sessionSentiment ?? 'all'}|${range.date_from}|${range.date_to}`}
        fetcher={() =>
          fetchSessions({
            ...dateRange,
            ...(sessionSentiment ? { sentiment: sessionSentiment } : {}),
          })
        }
        onPickSession={openSession}
      />

      <TopicListSheet
        open={drill?.kind === 'topics'}
        onOpenChange={(o) => {
          if (!o) closeDrill()
        }}
        title={t('dashboard.kpi.topics')}
        topics={topics}
        range={dateRange}
      />
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
