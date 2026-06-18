import { cn } from '@/lib/utils'
import { PRESET_LABEL_KEYS, type DateRangePreset } from '@/lib/date-range'
import { useT } from '@/lib/i18n'

interface DateRangeChipsProps {
  value: DateRangePreset
  onChange(next: DateRangePreset): void
  className?: string
}

const PRESETS: DateRangePreset[] = ['7d', '30d', '90d']

export function DateRangeChips({ value, onChange, className }: DateRangeChipsProps) {
  const t = useT()
  return (
    <div
      role="tablist"
      aria-label={t('dateRange.aria')}
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
            {t(PRESET_LABEL_KEYS[preset])}
          </button>
        )
      })}
    </div>
  )
}
