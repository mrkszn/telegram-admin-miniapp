import { lazy, Suspense, type ReactNode } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { LanguageSync } from '@/lib/i18n/LanguageSync'
import { BgParticles } from '@/components/feedback/BgParticles'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { RootRoute } from '@/routes/root'
import { DashboardRoute } from '@/routes/dashboard'

// Lazy routes — each becomes its own async chunk fetched on navigation.
// Critically, /metrics and /ask are the only screens pulling in @tremor/react
// (Recharts ≈ charts-*.js), so lazy-loading them keeps that heavy chunk out of
// the initial bundle. RootRoute (auth bootstrap) and DashboardRoute (landing)
// stay eager so the first screen paints without an extra round-trip.
const MetricsRoute = lazy(() =>
  import('@/routes/metrics').then((m) => ({ default: m.MetricsRoute })),
)
const TopicsRoute = lazy(() =>
  import('@/routes/topics').then((m) => ({ default: m.TopicsRoute })),
)
const ClientsRoute = lazy(() =>
  import('@/routes/clients').then((m) => ({ default: m.ClientsRoute })),
)
const AskRoute = lazy(() => import('@/routes/ask').then((m) => ({ default: m.AskRoute })))
const SessionRoute = lazy(() =>
  import('@/routes/session').then((m) => ({ default: m.SessionRoute })),
)
const SettingsRoute = lazy(() =>
  import('@/routes/settings').then((m) => ({ default: m.SettingsRoute })),
)
const PrizesRoute = lazy(() =>
  import('@/routes/prizes').then((m) => ({ default: m.PrizesRoute })),
)

function lazyRoute(node: ReactNode): ReactNode {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>
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
  { path: '/prizes', element: lazyRoute(<PrizesRoute />) },
])

export function App() {
  return (
    <ThemeProvider>
      <LanguageSync />
      <BgParticles />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
