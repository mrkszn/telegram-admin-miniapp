import { Navigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export function RootRoute() {
  const { isReady, isBootstrapping, error } = useAuth()

  if (isReady) {
    return <Navigate to="/example/dashboard" replace />
  }
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-ink">
        <div className="card-shell flex max-w-sm flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="h-5 w-5" strokeWidth={1.75} />
            <span className="font-medium">Не удалось войти</span>
          </div>
          <p className="text-sm text-muted">{error}</p>
          <p className="text-xs text-muted-2">
            Откройте приложение через Telegram, чтобы получить initData.
          </p>
        </div>
      </main>
    )
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg text-ink">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={1.75} />
        <span className="text-sm text-muted">
          {isBootstrapping ? 'Авторизация…' : 'Инициализация…'}
        </span>
      </div>
    </main>
  )
}
