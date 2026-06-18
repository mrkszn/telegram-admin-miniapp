import { cn } from '@/lib/utils'
import { AnimatedBar } from '@/components/feedback/AnimatedBar'
import { CountUp } from '@/components/feedback/CountUp'
import { useT } from '@/lib/i18n'
import type { TopicCount } from '@/lib/api/types'

interface TopTopicsCardProps {
  title: string
  tone: 'positive' | 'negative'
  topics: TopicCount[]
  /** Max rows to render (defaults to 3). */
  limit?: number
  emptyHint?: string
  /** When set, the whole card becomes a button (drill-down affordance). */
  onClick?: () => void
  /** Accessible label for the clickable card. */
  ariaLabel?: string
}

const dotTone: Record<TopTopicsCardProps['tone'], string> = {
  positive: 'bg-success',
  negative: 'bg-danger',
}

const barTone: Record<TopTopicsCardProps['tone'], string> = {
  positive: 'bg-success',
  negative: 'bg-danger',
}

const countTone: Record<TopTopicsCardProps['tone'], string> = {
  positive: 'text-success',
  negative: 'text-danger',
}

export function TopTopicsCard({
  title,
  tone,
  topics,
  limit = 3,
  emptyHint,
  onClick,
  ariaLabel,
}: TopTopicsCardProps) {
  const t = useT()
  const items = topics.slice(0, limit)
  const empty = emptyHint ?? t('common.noData')
  const max = items[0]?.count ?? 0
  const clickable = onClick != null
  const Tag = clickable ? 'button' : 'div'
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      aria-label={clickable ? ariaLabel : undefined}
      className={cn(
        'card-shell flex flex-col gap-2.5 text-left',
        clickable &&
          'cursor-pointer transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
          {title}
        </span>
        <span className={cn('h-1.5 w-1.5 rounded-full', dotTone[tone])} aria-hidden="true" />
      </div>
      {items.length === 0 ? (
        <span className="text-sm text-muted">{empty}</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((t, i) => (
            <li
              key={`${tone}|${t.topic}`}
              className="flex animate-fade-rise flex-col gap-1"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline gap-2">
                <span className="flex-1 truncate text-[13px] text-ink">{t.topic}</span>
                <span className={cn('serif-num text-base', countTone[tone])}>
                  <CountUp to={t.count} delayMs={140 + i * 70} durationMs={650} />
                </span>
              </div>
              <AnimatedBar
                pct={max > 0 ? (t.count / max) * 100 : 0}
                className={barTone[tone]}
                heightClassName="h-1"
                delayMs={120 + i * 80}
                label={`${t.topic}: ${t.count}`}
              />
            </li>
          ))}
        </ul>
      )}
    </Tag>
  )
}
