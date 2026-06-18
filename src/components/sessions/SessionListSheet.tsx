import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SentimentChip } from '@/components/sessions/SentimentChip'
import { toApiError } from '@/lib/api/client'
import { useT, useLanguage, dateLocale } from '@/lib/i18n'
import type { ApiError, SessionRef, SessionsResponse } from '@/lib/api/types'

interface SessionListSheetProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  description?: string
  fetcher: () => Promise<SessionsResponse>
  fetchKey: string
  onPickSession(sessionId: string): void
}

/** Bottom-sheet list of sessions; a tap hands the id back to the caller. */
export function SessionListSheet({
  open,
  onOpenChange,
  title,
  description,
  fetcher,
  fetchKey,
  onPickSession,
}: SessionListSheetProps) {
  const t = useT()
  const [sessions, setSessions] = useState<SessionRef[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSessions(null)
    setError(null)
    fetcher()
      .then((res) => {
        if (!cancelled) setSessions(res.sessions)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toApiError(err))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fetchKey, reloadTick])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-sheet">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={description ? undefined : 'sr-only'}>
            {description ?? title}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-3">
          {error ? (
            <ErrorState onRetry={() => setReloadTick((n) => n + 1)} />
          ) : sessions == null ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted">
              <BrandSpinner size="sm" />
              <span>{t('clients.searching')}</span>
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-3 text-sm text-muted">{t('sessions.empty')}</p>
          ) : (
            <ul className="flex list-none flex-col gap-2 p-0" data-testid="session-list">
              {sessions.map((s) => (
                <li key={s.id}>
                  <SessionRow session={s} onPick={() => onPickSession(s.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SessionRow({ session, onPick }: { session: SessionRef; onPick(): void }) {
  const t = useT()
  const lang = useLanguage()
  const name =
    session.client_name ??
    (session.client_id != null
      ? t('clients.client', { id: session.client_id })
      : t('clients.anon'))
  const date = new Date(session.started_at).toLocaleDateString(dateLocale(lang), {
    day: '2-digit',
    month: 'short',
  })

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full flex-col gap-1.5 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{name}</span>
        <span className="shrink-0 whitespace-nowrap font-mono text-[11.5px] text-muted-2">
          {date}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <SentimentChip sentiment={session.sentiment} />
        {session.topics.slice(0, 3).map((tp) => (
          <span
            key={tp}
            className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2"
          >
            {tp}
          </span>
        ))}
      </div>
    </button>
  )
}
