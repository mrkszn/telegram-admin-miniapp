import { Moon, Sun, SunMoon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemePreference, type ThemePreference } from '@/lib/hooks/useThemePreference'
import { useT, type TranslationKey } from '@/lib/i18n'

/**
 * Header pill that cycles auto → light → dark → auto.
 * The `data-theme` attribute on <html> is owned by ThemeProvider;
 * we only mutate the user preference here. ThemeProvider re-renders
 * whenever the preference store changes.
 */
const ICON: Record<ThemePreference, typeof Sun> = {
  auto: SunMoon,
  light: Sun,
  dark: Moon,
}

const LABEL_KEY: Record<ThemePreference, TranslationKey> = {
  auto: 'themeToggle.auto',
  light: 'themeToggle.light',
  dark: 'themeToggle.dark',
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useT()
  const { preference, cycle } = useThemePreference()
  const Icon = ICON[preference]
  const label = t(LABEL_KEY[preference])

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={cn(
        '-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-tag text-ink transition-colors hover:bg-surface-2 active:bg-surface-2',
        className,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
