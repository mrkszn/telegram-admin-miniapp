import { useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { ChevronDown, BarChart3, PieChart } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { DateRangeChips } from '@/components/filters/DateRangeChips'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { AnimatedBar } from '@/components/feedback/AnimatedBar'
import { CountUp } from '@/components/feedback/CountUp'
import { useApi } from '@/lib/hooks/useApi'
import { resolveRange, DEFAULT_PRESET, type DateRangePreset } from '@/lib/date-range'
import { fetchMetrics, fetchQuestions } from '@/lib/api/admin'
import {
  DEFAULT_METRIC_KEY,
  METRIC_KEYS as STATIC_METRIC_KEYS,
  labelFor as staticLabelFor,
  type MetricKeyOption,
} from '@/lib/metric-keys'
import { cn } from '@/lib/utils'
import type { MetricsResponse, QuestionsResponse } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

type GroupBy = 'day' | 'week'

interface MetricKeyOptionsState {
  options: MetricKeyOption[]
  loaded: boolean
}

function useMetricKeyOptions(): MetricKeyOptionsState {
  // Pull questions from backend on mount; fall back to the static seed list
  // if the call fails. Filters out 'text' questions — they're not chartable
  // and only confuse the picker. `loaded` lets the page suspend metric
  // fetches until we know the real key list — otherwise the initial
  // metricKey defaults to a stale STATIC value and produces a 404 on
  // every mount, which the user reads as "metrics keep erroring out".
  const { data } = useApi<QuestionsResponse>('questions|active', () => fetchQuestions())
  if (!data) return { options: STATIC_METRIC_KEYS, loaded: false }
  const live = data.questions
    .filter((q) => q.expected_type !== 'text' && q.metric_key.trim())
    .map((q) => ({ value: q.metric_key, label: q.text || q.metric_key }))
  return {
    options: live.length > 0 ? live : STATIC_METRIC_KEYS,
    loaded: true,
  }
}

export function MetricsRoute() {
  const { options, loaded } = useMetricKeyOptions()
  const fallbackKey = options[0]?.value ?? DEFAULT_METRIC_KEY
  // Initialise as null so we can tell "user hasn't picked yet" apart from
  // "user explicitly picked something". Once the live list arrives we
  // either inherit the user's pick (if it survived) or pick the first
  // real key from the backend — never a static placeholder that 404s.
  const [metricKey, setMetricKey] = useState<string | null>(null)
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET)
  const [groupBy, setGroupBy] = useState<GroupBy>('day')

  // Sync the active key with the live options once they land.
  if (
    loaded &&
    (metricKey === null || !options.find((o) => o.value === metricKey))
  ) {
    setMetricKey(fallbackKey)
  }

  const range = useMemo(() => resolveRange(preset), [preset])
  const queryKey = metricKey
    ? `metrics|${metricKey}|${range.date_from}|${range.date_to}|${groupBy}`
    : null

  // Suspend the metrics call until we have a key that's verified to exist
  // in the backend's questions table. useApi returns loading state when
  // the fetcher is null.
  const { data, error, isLoading, refetch } = useApi<MetricsResponse>(
    queryKey,
    metricKey
      ? () =>
          fetchMetrics({
            metric_key: metricKey,
            date_from: range.date_from,
            date_to: range.date_to,
            group_by: groupBy,
          })
      : null,
  )

  const displayKey = metricKey ?? fallbackKey
  const label = labelFor(displayKey, options)
  const isNumber = data?.expected_type === 'number'

  return (
    <AppShell title="Метрики" navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        <FilterBar
          metricKey={displayKey}
          options={options}
          onMetricKeyChange={setMetricKey}
          preset={preset}
          onPresetChange={setPreset}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          showGroupBy={isNumber}
        />

        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <MetricsSkeleton />
        ) : (
          <MetricView data={data} label={label} />
        )}
      </div>
    </AppShell>
  )
}

function labelFor(key: string, options: MetricKeyOption[]): string {
  return options.find((m) => m.value === key)?.label ?? staticLabelFor(key)
}

/* ── filter bar ─────────────────────────────────────────── */

interface FilterBarProps {
  metricKey: string
  options: MetricKeyOption[]
  onMetricKeyChange(next: string): void
  preset: DateRangePreset
  onPresetChange(next: DateRangePreset): void
  groupBy: GroupBy
  onGroupByChange(next: GroupBy): void
  showGroupBy: boolean
}

function FilterBar({
  metricKey,
  options,
  onMetricKeyChange,
  preset,
  onPresetChange,
  groupBy,
  onGroupByChange,
  showGroupBy,
}: FilterBarProps) {
  const currentLabel = labelFor(metricKey, options)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Выбрать метрику"
            className="inline-flex h-8 max-w-[200px] items-center gap-1.5 truncate rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-w-[260px]">
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => onMetricKeyChange(opt.value)}
              className={cn(
                'cursor-pointer rounded-tag px-3 py-2 text-sm',
                opt.value === metricKey && 'bg-brand-soft text-brand-deep',
              )}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DateRangeChips value={preset} onChange={onPresetChange} />

      {showGroupBy ? <GroupByToggle value={groupBy} onChange={onGroupByChange} /> : null}
    </div>
  )
}

function GroupByToggle({
  value,
  onChange,
}: {
  value: GroupBy
  onChange(next: GroupBy): void
}) {
  const options: Array<{ value: GroupBy; label: string }> = [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
  ]
  return (
    <div
      role="group"
      aria-label="Группировка"
      className="ml-auto inline-flex rounded-full border border-line bg-surface p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-6 rounded-full px-2.5 text-[12px] font-medium transition-colors',
              active ? 'bg-brand text-brand-on' : 'text-muted',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── views ──────────────────────────────────────────────── */

function MetricView({ data, label }: { data: MetricsResponse; label: string }) {
  switch (data.expected_type) {
    case 'unknown':
      return <EmptyCard message={`Метрика «${label}» не найдена.`} />
    case 'text':
      return (
        <EmptyCard message="Текстовая метрика — используйте «Топики» или «Клиенты» для анализа." />
      )
    case 'number': {
      const points = data.points ?? []
      if (points.length === 0)
        return <EmptyCard message={`По метрике «${label}» данных за период нет.`} />
      return <NumberView data={data} label={label} />
    }
    case 'enum':
    case 'boolean': {
      const dist = data.distribution ?? []
      if (dist.length === 0)
        return <EmptyCard message={`По метрике «${label}» данных за период нет.`} />
      return <EnumView data={data} label={label} />
    }
    default:
      return <EmptyCard message="Неподдерживаемый тип метрики." />
  }
}

function NumberView({ data, label }: { data: MetricsResponse; label: string }) {
  const points = data.points ?? []
  const chartData = points.map((p) => ({
    bucket: p.bucket,
    avg: p.avg ?? 0,
  }))
  const avgs = points.map((p) => p.avg ?? 0)
  const overall = avgs.length > 0 ? avgs.reduce((s, v) => s + v, 0) / avgs.length : 0
  const overallFmt = overall
    .toLocaleString('ru-RU', { maximumFractionDigits: 2 })
    .replace('.', ',')

  return (
    <div className="flex flex-col gap-4">
      <LineChartCard
        title={
          <span className="flex items-baseline gap-2">
            <span className="serif-num text-4xl leading-none">{overallFmt}</span>
            <span className="font-mono text-xs text-muted">ср. за период</span>
          </span>
        }
        subtitle={`Среднее по метрике «${label}»`}
        data={chartData}
        index="bucket"
        categories={['avg']}
        colors={['violet']}
        valueFormatter={(n) => n.toFixed(2)}
        height={180}
      />

      <section className="flex flex-col gap-2">
        <header className="flex items-baseline gap-2">
          <span className="serif-num text-base text-muted-2">01</span>
          <h2 className="font-serif text-lg italic">Значения по дням</h2>
        </header>
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex items-center bg-surface-2 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            <span className="flex-1">День</span>
            <span className="w-[70px] text-right">Среднее</span>
            <span className="w-[60px] text-right">Кол-во</span>
          </div>
          {points.map((p) => (
            <div
              key={p.bucket}
              className="flex items-center border-t border-line px-3.5 py-3"
            >
              <span className="flex-1 truncate text-sm font-medium text-ink">{p.bucket}</span>
              <span className="w-[70px] text-right font-mono text-sm font-medium text-ink">
                {p.avg != null ? p.avg.toFixed(2) : '—'}
              </span>
              <span className="w-[60px] text-right font-mono text-[13px] font-medium text-muted">
                {p.count}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

type EnumChartKind = 'bar' | 'donut'

function EnumView({ data, label }: { data: MetricsResponse; label: string }) {
  const [chartKind, setChartKind] = useState<EnumChartKind>('bar')
  const dist = [...(data.distribution ?? [])].sort((a, b) => b.count - a.count)
  const max = dist[0]?.count ?? 0
  const total = data.total ?? dist.reduce((s, d) => s + d.count, 0)
  const unknown = data.unknown ?? 0
  const chartData = dist.map((d) => ({ value: d.value, count: d.count }))

  const sharedTitle = (
    <span className="flex items-baseline gap-2">
      <span className="serif-num text-3xl leading-none">
        {total.toLocaleString('ru-RU')}
      </span>
      <span className="font-mono text-xs text-muted">значений</span>
    </span>
  )
  const sharedSubtitle = `Распределение по метрике «${label}»`

  return (
    <div className="flex flex-col gap-4">
      <EnumChartKindToggle value={chartKind} onChange={setChartKind} />

      {chartKind === 'bar' ? (
        <BarChartCard
          title={sharedTitle}
          subtitle={sharedSubtitle}
          data={chartData}
          index="value"
          categories={['count']}
          colors={['violet']}
          // Vertical layout keeps every category label visible on the y-axis
          // — horizontal layout was dropping every other label on narrow
          // 375 px Telegram screens, leaving only "Первый раз" / "Меньше
          // месяца" out of five categories.
          layout="vertical"
          // Taller canvas so 5+ rows fit comfortably with the rotated layout.
          height={32 + chartData.length * 36}
        />
      ) : (
        <DonutChartCard
          title={sharedTitle}
          subtitle={sharedSubtitle}
          data={chartData}
          index="value"
          category="count"
          centerCaption="всего"
          height={210}
        />
      )}

      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <span>
          Всего:{' '}
          <span className="serif-num text-base text-ink">
            <CountUp to={total} durationMs={900} />
          </span>
        </span>
        {unknown > 0 ? (
          <span>
            Не определено:{' '}
            <span className="serif-num text-base text-ink">
              <CountUp to={unknown} durationMs={900} delayMs={120} />
            </span>
          </span>
        ) : null}
      </div>

      <section className="flex flex-col gap-2">
        <header className="flex items-baseline gap-2">
          <span className="serif-num text-base text-muted-2">01</span>
          <h2 className="font-serif text-lg italic">Категории</h2>
        </header>
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {dist.map((d, i) => (
            <div
              key={d.value}
              className={cn(
                'flex animate-fade-rise items-center gap-2.5 px-3.5 py-3',
                i < dist.length - 1 && 'border-b border-line',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex-1 truncate text-sm font-medium text-ink">{d.value}</span>
              <AnimatedBar
                pct={(d.count / Math.max(max, 1)) * 100}
                className="bg-brand"
                wrapperClassName="w-[92px]"
                delayMs={150 + i * 80}
                label={`${d.value}: ${d.count}`}
              />
              <span className="w-[38px] text-right font-mono text-[13px] font-medium text-ink">
                <CountUp to={d.count} delayMs={180 + i * 80} durationMs={650} />
              </span>
              <span className="w-[40px] text-right font-mono text-[12px] font-medium text-muted-2">
                <CountUp
                  to={Math.round(d.pct * 100)}
                  delayMs={200 + i * 80}
                  durationMs={650}
                  suffix="%"
                />
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>

function EnumChartKindToggle({
  value,
  onChange,
}: {
  value: EnumChartKind
  onChange(next: EnumChartKind): void
}) {
  const options: Array<{ value: EnumChartKind; label: string; Icon: LucideIcon }> = [
    { value: 'bar', label: 'Столбцы', Icon: BarChart3 },
    { value: 'donut', label: 'Кольцо', Icon: PieChart },
  ]
  return (
    <div
      role="group"
      aria-label="Тип графика"
      className="inline-flex w-fit rounded-full border border-line bg-surface p-0.5"
    >
      {options.map(({ value: v, label, Icon }) => {
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => onChange(v)}
            className={cn(
              'flex h-8 w-9 items-center justify-center rounded-full transition-colors',
              active ? 'bg-brand text-brand-on' : 'text-muted hover:text-ink-2',
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="card-shell">
      <p className="text-sm text-muted">{message}</p>
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <>
      <Skeleton className="h-[240px]" />
      <Skeleton className="h-[220px]" />
    </>
  )
}
