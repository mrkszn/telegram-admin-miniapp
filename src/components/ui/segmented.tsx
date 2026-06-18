import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  /** Accessible group label, surfaced via aria-label on the tablist. */
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange(next: T): void
  /** Disable interaction (e.g. while a save is in flight). */
  disabled?: boolean
  className?: string
}

/**
 * Mobile-first segmented control: a single track holding equal-width
 * options, the active one filled with the brand colour. Built from plain
 * buttons (role=tab) so it matches the lightweight chip pattern already
 * used by DateRangeChips, but stretches full-width for the settings forms.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex w-full gap-1 rounded-input border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-tag px-3 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-60',
              active
                ? 'bg-brand text-brand-on shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
