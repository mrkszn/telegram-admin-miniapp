import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { RootRoute } from '@/routes/root'
import { DashboardRoute } from '@/routes/dashboard'
import { MetricsRoute } from '@/routes/metrics'
import { TopicsRoute } from '@/routes/topics'
import { ClientsRoute } from '@/routes/clients'
import { AskRoute } from '@/routes/ask'

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/dashboard', element: <DashboardRoute /> },
  { path: '/metrics', element: <MetricsRoute /> },
  { path: '/topics', element: <TopicsRoute /> },
  { path: '/clients', element: <ClientsRoute /> },
  { path: '/ask', element: <AskRoute /> },
])

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
