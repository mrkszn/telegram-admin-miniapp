import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { BgBubbles } from '@/components/feedback/BgBubbles'
import { BrandMark } from '@/components/brand/BrandMark'
import { useT } from '@/lib/i18n'

interface AuthGateProps {
  children: ReactNode
}

/**
 * Gates the entire router on Telegram auth. Until `useAuth` reports ready,
 * we paint a branded splash (bubbles + BrandMark + spinner) so the user
 * never sees a raw white screen during init. On error we surface the
 * "open via Telegram" instruction inline.
 *
 * Replaces the old `RootRoute → Navigate to readLastTab()` indirection —
 * the landing is now always the chat at `/`, so this gate just renders
 * children once we have a JWT.
 */
export function AuthGate({ children }: AuthGateProps) {
  const t = useT()
  const { isReady, isBootstrapping, error } = useAuth()

  if (isReady) return <>{children}</>

  // Shared splash scaffold — `isolate` opens a local stacking context so
  // BgBubbles' -z-10 stays inside the splash instead of escaping past the
  // page background and rendering invisible.
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
