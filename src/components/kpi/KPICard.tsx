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
        'flex min-w-0 flex-col gap-2 overflow-hidden rounded-card border border-line bg-surface p-4',
        // Tap micro-interaction + enter animation. tw-animate-css ships
        // these utilities; on tap the card subtly recedes (active:scale)
        // and on mount it fades + rises 8 px into place.
        'animate-fade-rise transition-transform duration-200 ease-out',
        'active:scale-[0.98]',
        className,
      )}
      // container-type makes 1cqi == 1% of THIS card's inline-size —
      // lets the .serif-num value auto-fit its content (see span below).
      style={{ containerType: 'inline-size' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        {delta ? (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-0.5 rounded-tag px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
              deltaTone[deltaKind],
            )}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {delta}
          </span>
        ) : null}
      </div>
      <div
        // No mid-word break, no layout change, no manual font reduction —
        // we use container queries (1cqw = 1% of the parent card width)
        // so the font-size auto-fits whatever text comes in. Short values
        // like "30" or "-0.17" stay at the design's --kpi-size (30 px),
        // long sentiment words (e.g. "neutral" / "нейтрально") quietly
        // shrink to fit on a single line without forcing hyphenation
        // that the previous build showed.
        className="serif-num whitespace-nowrap leading-tight text-ink"
        style={{
          // clamp(min, dynamic, max): on a ~165 px card the dynamic term
          // gives ~24 px (small enough for a long sentiment word to fit one
          // line); on roomier cards it climbs to --kpi-size (30 px) for
          // "30 %" / "-0.17" etc.
          fontSize: 'clamp(1.125rem, calc(12cqi + 0.25rem), var(--kpi-size))',
        }}
      >
        {value}
      </div>
      {caption ? <div className="truncate text-xs text-muted">{caption}</div> : null}
      {spark ? <div className="mt-1 h-8">{spark}</div> : null}
    </div>
  )
}
