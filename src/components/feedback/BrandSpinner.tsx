import { cn } from '@/lib/utils'

/**
 * Brand loading spinner. SVG ring with a sweep arc in the cyan→violet
 * brand gradient and a pulsing brand-violet dot inside. Used in place of
 * `Loader2` from lucide everywhere we previously showed a generic
 * spinner.
 *
 * Sizes map to common Telegram WebView spots:
 *   sm = 20 px  (search field, inline buttons)
 *   md = 32 px  (header buttons, KPI inline)
 *   lg = 64 px  (full-screen bootstrap)
 */
interface BrandSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Optional caption rendered below the ring. */
  label?: string
}

const SIZE: Record<NonNullable<BrandSpinnerProps['size']>, number> = {
  sm: 20,
  md: 32,
  lg: 64,
}

export function BrandSpinner({ size = 'md', className, label }: BrandSpinnerProps) {
  const px = SIZE[size]
  const stroke = size === 'sm' ? 2 : size === 'md' ? 2.5 : 3
  const radius = (px - stroke) / 2
  const cx = px / 2

  return (
    <div
      role="status"
      aria-label={label ?? 'Загрузка'}
      className={cn('inline-flex flex-col items-center gap-2', className)}
    >
      <span className="relative inline-flex" style={{ width: px, height: px }}>
        <svg
          className="-rotate-90 animate-spin-slow"
          viewBox={`0 0 ${px} ${px}`}
          width={px}
          height={px}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`brand-spinner-grad-${size}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
            opacity={0.4}
          />
          {/* Sweep arc — dasharray + dashoffset traces 1/3 of the ring,
              parent rotation animates the whole thing. */}
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke={`url(#brand-spinner-grad-${size})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * radius * 0.33} ${2 * Math.PI * radius}`}
          />
        </svg>
        {/* Pulsing brand dot in the centre. */}
        {size !== 'sm' ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 m-auto animate-brand-pulse rounded-full bg-brand"
            style={{
              width: px * 0.18,
              height: px * 0.18,
            }}
          />
        ) : null}
      </span>
      {label ? <span className="text-sm text-muted">{label}</span> : null}
    </div>
  )
}
