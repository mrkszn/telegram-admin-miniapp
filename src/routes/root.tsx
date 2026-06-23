import { Navigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { TelegramLoginGate } from '@/components/auth/TelegramLoginGate'
import { isInsideTelegram } from '@/lib/telegram/sdk'
import { readLastTab } from '@/lib/state/view-prefs'
import { useT } from '@/lib/i18n'

export function RootRoute() {
  const t = useT()
  const { isReady, isBootstrapping, error } = useAuth()

  if (isReady) {
    // Land back on the last visited tab (persisted across restarts), not
    // always /dashboard.
    return <Navigate to={readLastTab()} replace />
  }
  // Outside Telegram: render the Login Widget gate. It owns its own
  // spinner / error / retry UI, so the legacy "open via Telegram" panel
  // only fires inside Telegram (e.g. expired initData).
  if (!isInsideTelegram()) {
    return <TelegramLoginGate />
  }
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-ink">
        <div className="card-shell flex max-w-sm flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="h-5 w-5" strokeWidth={1.75} />
            <span className="font-medium">{t('root.loginFailed')}</span>
          </div>
          <p className="text-sm text-muted">{error}</p>
          <p className="text-xs text-muted-2">{t('root.openViaTelegram')}</p>
        </div>
      </main>
    )
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg text-ink">
      <BrandSpinner
        size="lg"
        label={isBootstrapping ? t('root.authorizing') : t('root.initializing')}
      />
    </main>
  )
}
