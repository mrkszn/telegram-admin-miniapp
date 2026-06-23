import { Moon, Sun, SunMoon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT, type TranslationKey } from '@/lib/i18n'
import { useThemePreference, type ThemePreference } from '@/lib/hooks/useThemePreference'

const META: Record<
  ThemePreference,
  { icon: LucideIcon; shortKey: TranslationKey; ariaKey: TranslationKey }
> = {
  auto: { icon: SunMoon, shortKey: 'themeCycle.auto', ariaKey: 'themeToggle.auto' },
  light: { icon: Sun, shortKey: 'themeCycle.light', ariaKey: 'themeToggle.light' },
  dark: { icon: Moon, shortKey: 'themeCycle.dark', ariaKey: 'themeToggle.dark' },
}

interface ThemeChipProps {
  className?: string
}

/**
 * Compact pill that cycles auto → light → dark → auto. Reusable: lives in
 * the drawer footer; the same control can be dropped into /settings or a
 * future quick-settings sheet without duplicating the icon/label dictionary.
 */
export function ThemeChip({ className }: ThemeChipProps) {
  const t = useT()
  const { preference, cycle } = useThemePreference()
  const { icon: Icon, shortKey, ariaKey } = META[preference]
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t(ariaKey)}
      title={t(ariaKey)}
      className={cn(
        'inline-flex items-center gap-2 rounded-input border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink',
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {t(shortKey)}
    </button>
  )
}
