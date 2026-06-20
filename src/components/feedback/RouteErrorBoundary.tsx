import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RotateCw } from 'lucide-react'
import { translate, getLanguage } from '@/lib/i18n'
import { isChunkLoadError, clearChunkReloadFlag } from '@/lib/lazy-with-retry'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time errors from a lazy route — most commonly the
 * "Failed to fetch dynamically imported module" thrown when the chunk
 * the open tab is reaching for got replaced by a deploy. The retry
 * helper already tries one auto-reload; if we land here, that auto-
 * reload was used (or disabled), so the fallback is a manual button.
 *
 * Translation happens via the non-hook `translate()` because class
 * components can't call hooks. Strings still come from the same i18n
 * catalogue, so the language toggle still works.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (typeof console !== 'undefined') {
      console.error('[RouteErrorBoundary]', error, info.componentStack)
    }
  }

  private handleReload = (): void => {
    clearChunkReloadFlag()
    if (typeof window !== 'undefined') window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    const lang = getLanguage()
    const chunkErr = isChunkLoadError(error)
    const title = translate(lang, 'common.error')
    const body = chunkErr
      ? translate(lang, 'common.sectionFailed')
      : (error.message || translate(lang, 'common.loadFailed'))
    const cta = translate(lang, 'common.reload')

    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-ink">
        <div
          role="alert"
          className="card-shell flex max-w-sm flex-col items-start gap-3 border-rose/30"
        >
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <p className="text-sm text-muted">{body}</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-1.5 rounded-input border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-line-strong"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {cta}
          </button>
        </div>
      </main>
    )
  }
}
