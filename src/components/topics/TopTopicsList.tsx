import { cn } from '@/lib/utils'
import type { TopicCount } from '@/lib/api/types'

interface TopTopicsListProps {
  topics: TopicCount[]
  tone: 'positive' | 'negative'
  limit?: number
  emptyHint?: string
}

const barTone: Record<TopTopicsListProps['tone'], string> = {
  positive: 'bg-success',
  negative: 'bg-danger',
}

/**
 * Top-N list — full-width rows with rank + name + relative bar + count.
 * Used on /dashboard for "Top-5 positive topics" and conceptually shared
 * with /topics.
 */
export function TopTopicsList({
  topics,
  tone,
  limit = 5,
  emptyHint = 'Нет данных',
}: TopTopicsListProps) {
  const items = topics.slice(0, limit)
  if (items.length === 0) {
    return (
      <div className="card-shell">
        <p className="text-sm text-muted">{emptyHint}</p>
      </div>
    )
  }
  const max = Math.max(...items.map((t) => t.count), 1)
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {items.map((t, i) => (
        <div
          key={t.topic}
          className={cn(
            'flex items-center gap-2.5 px-3.5 py-3',
            i < items.length - 1 && 'border-b border-line',
          )}
        >
          <span className="serif-num w-5 text-[15px] text-muted-2">{i + 1}</span>
          <span className="flex-1 truncate text-sm font-medium text-ink">{t.topic}</span>
          <div className="h-2 w-[90px] overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full', barTone[tone])}
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[13px] font-medium tabular-nums text-ink">
            {t.count}
          </span>
        </div>
      ))}
    </div>
  )
}
