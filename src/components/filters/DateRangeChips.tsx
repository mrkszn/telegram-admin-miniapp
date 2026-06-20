import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PRESET_LABEL_KEYS,
  dateInputToIso,
  isoToDateInputValue,
  type DateRangePreset,
  type DateRangeSelection,
} from '@/lib/date-range'
import { useT } from '@/lib/i18n'

interface DateRangeChipsProps {
  value: DateRangeSelection
  onChange(next: DateRangeSelection): void
  className?: string
}

const PRESETS: DateRangePreset[] = ['7d', '30d', '90d']

/**
 * Period picker. Three preset chips ("7д / 30д / 90д") + a custom chip that
 * opens a small two-input panel for a fixed window. Both modes feed into the
 * same shared selection state.
 */
export function DateRangeChips({ value, onChange, className }: DateRangeChipsProps) {
  const t = useT()
  const [open, setOpen] = useState(value.kind === 'custom')
  const customActive = value.kind === 'custom'

  const today = isoToDateInputValue(new Date().toISOString())
  const draftFrom =
    customActive && value.date_from ? isoToDateInputValue(value.date_from) : ''
  const draftTo =
    customActive && value.date_to ? isoToDateInputValue(value.date_to) : today

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div role="tablist" aria-label={t('dateRange.aria')} className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((preset) => {
          const active = value.kind === 'preset' && value.preset === preset
          return (
            <button
              key={preset}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                onChange({ kind: 'preset', preset })
                setOpen(false)
              }}
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

        <button
          type="button"
          role="tab"
          aria-selected={customActive}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
            customActive
              ? 'border-brand bg-brand text-brand-on'
              : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          {t('dateRange.custom')}
        </button>
      </div>

      {open ? (
        <CustomRangePanel
          fromValue={draftFrom}
          toValue={draftTo}
          maxValue={today}
          onApply={(from, to) => {
            if (!from || !to) return
            onChange({
              kind: 'custom',
              date_from: dateInputToIso(from, false),
              date_to: dateInputToIso(to, true),
            })
          }}
        />
      ) : null}
    </div>
  )
}

function CustomRangePanel({
  fromValue,
  toValue,
  maxValue,
  onApply,
}: {
  fromValue: string
  toValue: string
  maxValue: string
  onApply(from: string, to: string): void
}) {
  const t = useT()
  const [from, setFrom] = useState(fromValue)
  const [to, setTo] = useState(toValue)
  const valid = from !== '' && to !== '' && from <= to

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-card border border-line bg-surface p-2.5">
      <label className="flex flex-col gap-1 text-[11px] font-medium text-muted">
        {t('dateRange.from')}
        <input
          type="date"
          value={from}
          max={to || maxValue}
          onChange={(e) => setFrom(e.target.value)}
          className="h-8 rounded-input border border-line bg-bg px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-muted">
        {t('dateRange.to')}
        <input
          type="date"
          value={to}
          min={from}
          max={maxValue}
          onChange={(e) => setTo(e.target.value)}
          className="h-8 rounded-input border border-line bg-bg px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <button
        type="button"
        disabled={!valid}
        onClick={() => onApply(from, to)}
        className="ml-auto h-8 rounded-full bg-brand px-3 text-xs font-medium text-brand-on transition-colors hover:bg-brand-hover disabled:opacity-40"
      >
        {t('dateRange.apply')}
      </button>
    </div>
  )
}
