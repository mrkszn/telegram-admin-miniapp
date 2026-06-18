import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { SessionSentiment } from '@/lib/api/types'

const CHIP: Record<SessionSentiment, string> = {
  positive: 'bg-mint/20 text-success',
  negative: 'bg-rose/20 text-danger',
  neutral: 'bg-surface-2 text-muted',
}

/** Small sentiment pill shared by the session list and timeline. */
export function SentimentChip({
  sentiment,
  className,
}: {
  sentiment: SessionSentiment | null
  className?: string
}) {
  const t = useT()
  if (sentiment == null) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-tag bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted',
          className,
        )}
      >
        —
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-tag px-2 py-0.5 text-[11px] font-semibold',
        CHIP[sentiment],
        className,
      )}
    >
      {t(`sentiment.${sentiment}`)}
    </span>
  )
}
