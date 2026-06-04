import { AlertCircle, RotateCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Не удалось загрузить данные. Попробуйте позже.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="card-shell flex flex-col items-start gap-3 border-rose/30"
    >
      <div className="flex items-center gap-2 text-danger">
        <AlertCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        <span className="text-sm font-medium">Ошибка</span>
      </div>
      <p className="text-sm text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-input border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line-strong"
        >
          <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          Повторить
        </button>
      ) : null}
    </div>
  )
}
