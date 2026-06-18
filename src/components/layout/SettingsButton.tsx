import { Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

/**
 * Header gear button — opens the /settings screen. Mirrors the sizing /
 * hover treatment of ThemeToggle so the two sit cleanly side-by-side in
 * the header right slot.
 */
interface SettingsButtonProps {
  className?: string
}

export function SettingsButton({ className }: SettingsButtonProps) {
  const t = useT()
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/settings')}
      aria-label={t('settingsButton.aria')}
      title={t('settingsButton.aria')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-tag text-ink transition-colors hover:bg-surface-2 active:bg-surface-2',
        className,
      )}
    >
      <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
