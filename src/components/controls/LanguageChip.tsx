import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { useLanguageSave } from '@/lib/hooks/useLanguageSave'
import type { SettingsLanguage } from '@/lib/api/types'

interface LanguageChipProps {
  className?: string
}

/**
 * Compact pill that flips between Ukrainian and English. Uses the shared
 * `useLanguageSave` hook so the choice is persisted via `updateSettings`
 * — without this round-trip, LanguageSync would overwrite the pick on the
 * next mount/reload.
 */
export function LanguageChip({ className }: LanguageChipProps) {
  const t = useT()
  const { language, saving, save } = useLanguageSave()
  const next: SettingsLanguage = language === 'uk' ? 'en' : 'uk'
  return (
    <button
      type="button"
      onClick={() => void save(next)}
      disabled={saving}
      aria-label={t('drawer.language.cycle')}
      title={t('drawer.language.cycle')}
      className={cn(
        'inline-flex items-center gap-2 rounded-input border border-line bg-surface px-3 py-1.5 text-[13px] uppercase tracking-wider text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-60',
        className,
      )}
    >
      <Languages className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {language}
    </button>
  )
}
