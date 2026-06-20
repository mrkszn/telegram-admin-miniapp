import type { ReactNode } from 'react'
import { BarChart } from '@tremor/react'
import { cn } from '@/lib/utils'
import { CHART_COLORS, type ChartColor } from './palette'

export interface BarChartCardProps<T extends Record<string, unknown>> {
  title: ReactNode
  subtitle?: ReactNode
  data: T[]
  index: keyof T & string
  categories: (keyof T & string)[]
  colors?: ChartColor[]
  valueFormatter?: (n: number) => string
  layout?: 'horizontal' | 'vertical'
  className?: string
  height?: number
  /** Override Tremor's y-axis gutter width. Defaults: 36 (horizontal) / 120 (vertical). */
  yAxisWidth?: number
  /** Pass-through to Tremor BarChart — render multi-category bars side-by-side instead of stacked. */
  stack?: boolean
}

export function BarChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  data,
  index,
  categories,
  colors = CHART_COLORS.slice(0, categories.length) as ChartColor[],
  valueFormatter,
  layout = 'horizontal',
  className,
  height = 200,
  yAxisWidth,
  stack,
}: BarChartCardProps<T>) {
  const resolvedYAxisWidth = yAxisWidth ?? (layout === 'vertical' ? 120 : 36)
  return (
    <div className={cn('rounded-card border border-line bg-surface p-4', className)}>
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="font-serif text-lg leading-tight text-ink">{title}</h3>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </div>
      <BarChart
        key={JSON.stringify(data)}
        className="animate-fade-rise"
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        layout={layout}
        showLegend={categories.length > 1}
        showAnimation
        animationDuration={700}
        yAxisWidth={resolvedYAxisWidth}
        stack={stack}
        style={{ height }}
      />
    </div>
  )
}
