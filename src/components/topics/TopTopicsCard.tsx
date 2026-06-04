import { cn } from '@/lib/utils'
import type { TopicCount } from '@/lib/api/types'

interface TopTopicsCardProps {
  title: string
  tone: 'positive' | 'negative'
  topics: TopicCount[]
  /** Max rows to render (defaults to 3). */
  limit?: number
  emptyHint?: string
}

const dotTone: Record<TopTopicsCardProps['tone'], string> = {
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
  emptyHint = 'Нет данных',
}: TopTopicsCardProps) {
  const items = topics.slice(0, limit)
  return (
    <div className="card-shell flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
          {title}
        </span>
        <span className={cn('h-1.5 w-1.5 rounded-full', dotTone[tone])} aria-hidden="true" />
      </div>
      {items.length === 0 ? (
        <span className="text-sm text-muted">{emptyHint}</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {items.map((t) => (
            <li key={t.topic} className="flex items-baseline gap-2">
              <span className="flex-1 truncate text-sm text-ink">{t.topic}</span>
              <span className={cn('serif-num text-base', countTone[tone])}>{t.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
