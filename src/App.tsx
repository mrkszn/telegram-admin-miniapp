import { Suspense, useEffect, type ReactNode } from 'react'
import { RouterProvider, createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AuthGate } from '@/components/layout/AuthGate'
import { AppDrawer } from '@/components/layout/AppDrawer'
import { LanguageSync } from '@/lib/i18n/LanguageSync'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { RouteErrorBoundary } from '@/components/feedback/RouteErrorBoundary'
import { lazyWithRetry, clearChunkReloadFlag } from '@/lib/lazy-with-retry'
import { LandingRouter } from '@/routes/landing'

// Lazy routes — each becomes its own async chunk fetched on navigation.
// /metrics pulls in @tremor/react (and chat embeds it on-demand via
// ChartFromText), so lazy-loading keeps the chart bundle out of the
// initial paint. LandingRouter is eager (it's the URL entry point); the
// ChatRoute it renders is also eager but still benefits from the
// RouteErrorBoundary + Suspense wrapper for ChartFromText chunk failures.
const DashboardRoute = lazyWithRetry(() =>
  import('@/routes/dashboard').then((m) => ({ default: m.DashboardRoute })),
)
const MetricsRoute = lazyWithRetry(() =>
  import('@/routes/metrics').then((m) => ({ default: m.MetricsRoute })),
)
const TopicsRoute = lazyWithRetry(() =>
  import('@/routes/topics').then((m) => ({ default: m.TopicsRoute })),
)
const ClientsRoute = lazyWithRetry(() =>
  import('@/routes/clients').then((m) => ({ default: m.ClientsRoute })),
)
const SessionRoute = lazyWithRetry(() =>
  import('@/routes/session').then((m) => ({ default: m.SessionRoute })),
)
const SettingsRoute = lazyWithRetry(() =>
  import('@/routes/settings').then((m) => ({ default: m.SettingsRoute })),
)
const PrizesRoute = lazyWithRetry(() =>
  import('@/routes/prizes').then((m) => ({ default: m.PrizesRoute })),
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

/**
 * Root layout for the router. Mounts the single global AppDrawer above
 * every authenticated screen so navigating between routes doesn't tear
 * down its Radix portal / focus trap.
 */
function RouterLayout() {
  return (
    <>
      <Outlet />
      <AppDrawer />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <RouterLayout />,
    children: [
      // `/` runs the cold/warm arbiter — fresh WebView → chat, warm
      // restart → resume on the last visited tab.
      { path: '/', element: lazyRoute(<LandingRouter />) },
      { path: '/dashboard', element: lazyRoute(<DashboardRoute />) },
      { path: '/metrics', element: lazyRoute(<MetricsRoute />) },
      { path: '/topics', element: lazyRoute(<TopicsRoute />) },
      { path: '/clients', element: lazyRoute(<ClientsRoute />) },
      { path: '/sessions/:id', element: lazyRoute(<SessionRoute />) },
      { path: '/settings', element: lazyRoute(<SettingsRoute />) },
      { path: '/prizes', element: lazyRoute(<PrizesRoute />) },
      // Soft redirect for the legacy /ask URL — bookmarks pointing at the
      // old path still land in the chat.
      { path: '/ask', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  // Clear the one-shot chunk-reload guard once the new shell is up so the
  // next deploy's chunk miss can use the auto-reload path again.
  useEffect(() => {
    clearChunkReloadFlag()
  }, [])
  return (
    <ThemeProvider>
      <LanguageSync />
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </ThemeProvider>
  )
}
