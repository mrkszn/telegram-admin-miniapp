import { cn } from '@/lib/utils'
import { PRESET_LABELS, type DateRangePreset } from '@/lib/date-range'

interface DateRangeChipsProps {
  value: DateRangePreset
  onChange(next: DateRangePreset): void
  className?: string
}

const PRESETS: DateRangePreset[] = ['7d', '30d', '90d']

export function DateRangeChips({ value, onChange, className }: DateRangeChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Период"
      className={cn('flex gap-2 overflow-x-auto pb-1', className)}
    >
      {PRESETS.map((preset) => {
        const active = preset === value
        return (
          <button
            key={preset}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(preset)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
              active
                ? 'border-brand bg-brand text-brand-on'
                : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {PRESET_LABELS[preset]}
          </button>
        )
      })}
    </div>
  )
}
