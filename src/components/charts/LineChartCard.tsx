import type { ReactNode } from 'react'
import { LineChart } from '@tremor/react'
import { cn } from '@/lib/utils'
import { CHART_COLORS, type ChartColor } from './palette'

export interface LineChartCardProps<T extends Record<string, unknown>> {
  title: ReactNode
  subtitle?: ReactNode
  data: T[]
  index: keyof T & string
  categories: (keyof T & string)[]
  colors?: ChartColor[]
  valueFormatter?: (n: number) => string
  className?: string
  /** Pixel height of the chart canvas. */
  height?: number
}

export function LineChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  data,
  index,
  categories,
  colors = CHART_COLORS.slice(0, categories.length) as ChartColor[],
  valueFormatter,
  className,
  height = 200,
}: LineChartCardProps<T>) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-4', className)}>
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="font-serif text-lg leading-tight text-ink">{title}</h3>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </div>
      <LineChart
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        showLegend={categories.length > 1}
        showAnimation={false}
        yAxisWidth={36}
        className={`h-[${height}px]`}
        style={{ height }}
      />
    </div>
  )
}
