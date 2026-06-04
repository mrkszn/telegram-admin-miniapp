import { useEffect } from 'react'
import { bootstrapAuth } from '@/lib/telegram/auth'
import { useSessionStore } from '@/lib/state/session-store'

export interface UseAuthOptions {
  /** Defaults to `import.meta.env.VITE_API_BASE_URL`. */
  apiBaseUrl?: string
  /** Defaults to `import.meta.env.VITE_AUTH_ENDPOINT`. */
  authEndpoint?: string
  /** Skip bootstrap (e.g. for storybook / preview routes). */
  disabled?: boolean
}

export interface UseAuthResult {
  token: string | null
  isReady: boolean
  isBootstrapping: boolean
  error: string | null
}

/**
 * On first mount: kicks off bootstrapAuth() using env vars. Re-uses the
 * session store; safe to call from multiple components — bootstrap only
 * fires once per page life unless the store is cleared.
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthResult {
  const token = useSessionStore((s) => s.token)
  const isReady = useSessionStore((s) => s.isReady)
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping)
  const error = useSessionStore((s) => s.error)

  const apiBaseUrl = options.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? ''
  const authEndpoint = options.authEndpoint ?? import.meta.env.VITE_AUTH_ENDPOINT ?? '/admin/auth'
  const disabled = options.disabled ?? false

  useEffect(() => {
    if (disabled) return
    const state = useSessionStore.getState()
    if (state.token || state.isBootstrapping) return
    void bootstrapAuth({ apiBaseUrl, authEndpoint }).catch(() => {
      // store already recorded the error; swallow to avoid unhandled rejection
    })
  }, [apiBaseUrl, authEndpoint, disabled])

  return { token, isReady, isBootstrapping, error }
}
