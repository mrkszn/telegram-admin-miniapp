import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DeltaKind = 'positive' | 'negative' | 'neutral'

export interface KPICardProps {
  label: ReactNode
  value: ReactNode
  /** Optional caption below the value (e.g. unit, period). */
  caption?: ReactNode
  /** Pre-formatted delta string (e.g. "+4.2%"). */
  delta?: ReactNode
  deltaKind?: DeltaKind
  /** Sparkline slot — accept any tiny chart you want to drop in. */
  spark?: ReactNode
  className?: string
}

const deltaTone: Record<DeltaKind, string> = {
  positive: 'text-success bg-mint/15',
  negative: 'text-danger bg-rose/15',
  neutral: 'text-muted bg-surface-2',
}

const deltaIcon: Record<DeltaKind, typeof ArrowUpRight> = {
  positive: ArrowUpRight,
  negative: ArrowDownRight,
  neutral: Minus,
}

export function KPICard({
  label,
  value,
  caption,
  delta,
  deltaKind = 'neutral',
  spark,
  className,
}: KPICardProps) {
  const DeltaIcon = deltaIcon[deltaKind]
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-card border border-line bg-surface p-4',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-tag px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
              deltaTone[deltaKind],
            )}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {delta}
          </span>
        ) : null}
      </div>
      <div className="serif-num text-[length:var(--kpi-size)] leading-none text-ink">{value}</div>
      {caption ? <div className="text-xs text-muted">{caption}</div> : null}
      {spark ? <div className="mt-1 h-8">{spark}</div> : null}
    </div>
  )
}
