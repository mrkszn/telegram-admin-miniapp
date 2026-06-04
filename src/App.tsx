import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { RootRoute } from '@/routes/root'
import { ExampleDashboard } from '@/routes/example/dashboard'

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/example/dashboard', element: <ExampleDashboard /> },
])

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
