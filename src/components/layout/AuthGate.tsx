import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { BgBubbles } from '@/components/feedback/BgBubbles'
import { BrandMark } from '@/components/brand/BrandMark'
import { TelegramLoginGate } from '@/components/auth/TelegramLoginGate'
import { useT } from '@/lib/i18n'

interface AuthGateProps {
  children: ReactNode
}

/**
 * Gates the entire router on auth. Three branches:
 *
 *  1. inside Telegram, ready  → render children
 *  2. outside Telegram + not signed in → render <TelegramLoginGate /> (the
 *     web subdomain's Login-Widget flow owns its own spinner / error UI)
 *  3. inside Telegram, still bootstrapping or errored → branded splash with
 *     BgBubbles + BrandMark + BrandSpinner (or the "open via Telegram"
 *     error card when initData is rejected)
 *
 * `isolate` opens a local stacking context so BgBubbles' `-z-10` stays
 * inside the splash instead of escaping past the page background and
 * rendering invisible.
 *
 * Replaces the old `RootRoute → Navigate to readLastTab()` indirection —
 * the route at `/` is now `LandingRouter`, which handles the cold/warm
 * tab-restore split once we're past this gate.
 */
export function AuthGate({ children }: AuthGateProps) {
  const t = useT()
  const { isReady, isBootstrapping, error, needsWebLogin } = useAuth()

  if (isReady) return <>{children}</>
  if (needsWebLogin) return <TelegramLoginGate />

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-ink">
      <BgBubbles />
      {error ? (
        <div className="card-shell relative z-10 flex max-w-sm flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="h-5 w-5" strokeWidth={1.75} />
            <span className="font-medium">{t('root.loginFailed')}</span>
          </div>
          <p className="text-sm text-muted">{error}</p>
          <p className="text-xs text-muted-2">{t('root.openViaTelegram')}</p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-5">
          <BrandMark size={64} />
          <BrandSpinner
            size="lg"
            label={isBootstrapping ? t('root.authorizing') : t('root.initializing')}
          />
        </div>
      )}
    </main>
  )
}
