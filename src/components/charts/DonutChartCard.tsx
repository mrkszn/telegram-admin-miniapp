import type { ReactNode } from 'react'
import { DonutChart, type Color } from '@tremor/react'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/feedback/CountUp'
import { CHART_COLORS, type ChartColor } from './palette'

export interface DonutChartCardProps<T extends Record<string, unknown>> {
  title: ReactNode
  subtitle?: ReactNode
  data: T[]
  /** Field holding the numeric value of each slice. */
  category: keyof T & string
  /** Field holding the label of each slice. */
  index: keyof T & string
  colors?: ChartColor[]
  valueFormatter?: (n: number) => string
  /**
   * Big content inside the ring (typically the total). Falls back to the
   * sum of `category` if not provided.
   */
  centerLabel?: ReactNode
  centerCaption?: ReactNode
  /** 'donut' (default, hole in the middle) or 'pie' (solid). */
  variant?: 'donut' | 'pie'
  className?: string
  /** Ring/canvas height. The card itself stays as tall as its content. */
  height?: number
}

export function DonutChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  data,
  category,
  index,
  colors = CHART_COLORS.slice(0, Math.max(data.length, 1)) as ChartColor[],
  valueFormatter,
  centerLabel,
  centerCaption,
  variant = 'donut',
  className,
  height = 200,
}: DonutChartCardProps<T>) {
  // Auto-total fallback so the user always sees something inside the ring.
  const autoTotal = data.reduce((s, row) => {
    const v = row[category]
    return typeof v === 'number' ? s + v : s
  }, 0)
  // Use a CountUp when no explicit centerLabel was passed — number then
  // ticks up while the ring is drawing, ending on the same value the
  // legend shows below.
  const centerNode =
    centerLabel ??
    (typeof autoTotal === 'number' ? (
      <CountUp to={autoTotal} durationMs={900} delayMs={80} />
    ) : (
      String(autoTotal)
    ))

  return (
    <div className={cn('rounded-card border border-line bg-surface p-4', className)}>
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="font-serif text-lg leading-tight text-ink">{title}</h3>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </div>

      <div className="relative" style={{ height }}>
        <DonutChart
          key={JSON.stringify(data)}
          data={data}
          category={category}
          index={index}
          colors={colors as Color[]}
          valueFormatter={valueFormatter}
          variant={variant}
          showLabel={false}
          showAnimation
          animationDuration={800}
          className="h-full w-full animate-fade-rise"
        />

        {/* Center label — Tremor renders the value at center natively when
            showLabel is true, but it doesn't give us caption + branding
            control. So we paint our own. */}
        {variant === 'donut' ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="serif-num text-2xl leading-none text-ink">{centerNode}</span>
            {centerCaption ? (
              <span className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted">
                {centerCaption}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Inline legend — Tremor's built-in legend is intentionally
          minimalist; we use our own chips so colours match the palette
          and labels wrap nicely on narrow Telegram screens. Each row
          fade-rises with a stagger and the count tweens in alongside. */}
      <ul className="mt-3 flex flex-col gap-1.5">
        {data.map((row, i) => {
          const label = String(row[index] ?? '')
          const value = Number(row[category] ?? 0)
          const color = colors[i % colors.length] ?? 'violet'
          const colorClass = `bg-${color}-500`
          return (
            <li
              key={label || i}
              className="flex animate-fade-rise items-center gap-2 text-[13px] text-ink-2"
              style={{ animationDelay: `${300 + i * 70}ms` }}
            >
              <span
                aria-hidden="true"
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colorClass)}
              />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="font-mono text-[12px] font-medium text-ink">
                {valueFormatter ? (
                  valueFormatter(value)
                ) : Number.isFinite(value) ? (
                  <CountUp to={value} delayMs={380 + i * 70} durationMs={650} />
                ) : (
                  String(value)
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
