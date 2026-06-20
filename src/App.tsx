import { Suspense, useEffect, type ReactNode } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { LanguageSync } from '@/lib/i18n/LanguageSync'
import { BgParticles } from '@/components/feedback/BgParticles'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { RouteErrorBoundary } from '@/components/feedback/RouteErrorBoundary'
import { lazyWithRetry, clearChunkReloadFlag } from '@/lib/lazy-with-retry'
import { RootRoute } from '@/routes/root'
import { DashboardRoute } from '@/routes/dashboard'

// Lazy routes — each becomes its own async chunk fetched on navigation.
// Critically, /metrics and /ask are the only screens pulling in @tremor/react
// (Recharts ≈ charts-*.js), so lazy-loading them keeps that heavy chunk out of
// the initial bundle. RootRoute (auth bootstrap) and DashboardRoute (landing)
// stay eager so the first screen paints without an extra round-trip.
//
// `lazyWithRetry` wraps each dynamic import so a stale-chunk failure after a
// deploy retries a couple of times, then triggers a single auto-reload guarded
// by sessionStorage. If even the reload can't recover, RouteErrorBoundary
// shows a manual fallback with a Reload button.
const MetricsRoute = lazyWithRetry(() =>
  import('@/routes/metrics').then((m) => ({ default: m.MetricsRoute })),
)
const TopicsRoute = lazyWithRetry(() =>
  import('@/routes/topics').then((m) => ({ default: m.TopicsRoute })),
)
const ClientsRoute = lazyWithRetry(() =>
  import('@/routes/clients').then((m) => ({ default: m.ClientsRoute })),
)
const AskRoute = lazyWithRetry(() =>
  import('@/routes/ask').then((m) => ({ default: m.AskRoute })),
)
const SessionRoute = lazyWithRetry(() =>
  import('@/routes/session').then((m) => ({ default: m.SessionRoute })),
)
const SettingsRoute = lazyWithRetry(() =>
  import('@/routes/settings').then((m) => ({ default: m.SettingsRoute })),
)

function lazyRoute(node: ReactNode): ReactNode {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>{node}</Suspense>
    </RouteErrorBoundary>
  )
}

function RouteFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg text-ink">
      <BrandSpinner size="lg" />
    </main>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/dashboard', element: <DashboardRoute /> },
  { path: '/metrics', element: lazyRoute(<MetricsRoute />) },
  { path: '/topics', element: lazyRoute(<TopicsRoute />) },
  { path: '/clients', element: lazyRoute(<ClientsRoute />) },
  { path: '/ask', element: lazyRoute(<AskRoute />) },
  { path: '/sessions/:id', element: lazyRoute(<SessionRoute />) },
  { path: '/settings', element: lazyRoute(<SettingsRoute />) },
])

export function App() {
  // Clear the one-shot chunk-reload guard once the new shell is up so the
  // next deploy's chunk miss can use the auto-reload path again. Runs on
  // every mount, but the underlying sessionStorage write is cheap.
  useEffect(() => {
    clearChunkReloadFlag()
  }, [])
  return (
    <ThemeProvider>
      <LanguageSync />
      <BgParticles />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
