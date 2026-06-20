import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ClientAvatar } from '@/components/clients/ClientAvatar'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CountUp } from '@/components/feedback/CountUp'
import { fetchClientProfile } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { useT, useLanguage, dateLocale, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { ApiError, ClientProfileResponse } from '@/lib/api/types'

type SheetView = 'profile' | 'sessions'

/**
 * Bottom-sheet client deep-dive — sessions count, average sentiment, top
 * topics and the most recent feedback cards. Opened from the Clients screen
 * and from every drill-down list (topic/category/session). Driven by a
 * nullable `telegramId`: non-null opens + fetches, null closes.
 */
export function ClientProfileSheet({
  telegramId,
  onOpenChange,
}: {
  telegramId: number | null
  onOpenChange(open: boolean): void
}) {
  const t = useT()
  const [profile, setProfile] = useState<ClientProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [view, setView] = useState<SheetView>('profile')

  useEffect(() => {
    if (telegramId == null) {
      setProfile(null)
      setError(null)
      setView('profile')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setView('profile')
    fetchClientProfile(telegramId)
      .then((res) => {
        if (!cancelled) setProfile(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [telegramId])

  const open = telegramId != null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-sheet">
        <SheetHeader>
          <SheetTitle className="sr-only">
            {view === 'sessions'
              ? t('clients.profile.sessionsTitle')
              : t('clients.profile.title')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('clients.profile.description')}
          </SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted">
            <BrandSpinner size="sm" />
            <span>{t('clients.profile.loading')}</span>
          </div>
        ) : error ? (
          <ErrorState message={t('clients.profile.loadError')} />
        ) : profile ? (
          view === 'sessions' ? (
            <SessionsView
              profile={profile}
              onBack={() => setView('profile')}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <ProfileBody profile={profile} onOpenSessions={() => setView('sessions')} />
          )
        ) : (
          <p className="py-3 text-sm text-muted">{t('clients.profile.notFound')}</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ProfileBody({
  profile,
  onOpenSessions,
}: {
  profile: ClientProfileResponse
  onOpenSessions(): void
}) {
  const t = useT()
  const lang = useLanguage()
  const sentColor =
    profile.avg_sentiment == null
      ? 'text-ink'
      : profile.avg_sentiment > 0.33
        ? 'text-success'
        : profile.avg_sentiment < -0.33
          ? 'text-danger'
          : 'text-warning'
  const last = profile.last_session_at
    ? new Date(profile.last_session_at).toLocaleDateString(dateLocale(lang), {
        day: '2-digit',
        month: 'long',
      })
    : '—'
  const name = profile.name ?? t('clients.client', { id: profile.telegram_id })
  const hasSessions = profile.sessions_count > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ClientAvatar name={profile.name} telegramId={profile.telegram_id} tone="brand" size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink">{name}</p>
          <p className="font-mono text-[12.5px] text-muted-2">
            telegram #{profile.telegram_id} · {t('clients.profile.lastSession')} {last}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ProfileStat
          label={t('clients.profile.sessions')}
          value={<CountUp to={profile.sessions_count} durationMs={900} />}
          onClick={hasSessions ? onOpenSessions : undefined}
          ariaLabel={t('clients.profile.viewSessions')}
        />
        <ProfileStat
          label="Sentiment"
          valueClassName={sentColor}
          value={
            profile.avg_sentiment != null ? (
              <CountUp
                to={profile.avg_sentiment}
                durationMs={900}
                delayMs={120}
                fractionDigits={2}
                prefix={profile.avg_sentiment > 0 ? '+' : ''}
              />
            ) : (
              '—'
            )
          }
        />
      </div>

      {profile.top_topics.length > 0 ? (
        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t('clients.profile.topics')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.top_topics.slice(0, 6).map((tp, i) => (
              <span
                key={tp.topic}
                className="animate-fade-rise rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                {tp.topic}{' '}
                <span className="ml-1 font-mono text-muted-2">{tp.count}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {profile.recent_cards.length > 0 ? (
        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t('clients.profile.recentCards')}
          </p>
          <div className="flex flex-col gap-2">
            {profile.recent_cards.slice(0, 3).map((card, i) => (
              <div
                key={cardKey(card, i)}
                className="animate-fade-rise"
                style={{ animationDelay: `${420 + i * 90}ms` }}
              >
                <RecentCardItem card={card} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function ProfileStat({
  label,
  value,
  valueClassName,
  onClick,
  ariaLabel,
}: {
  label: ReactNode
  value: ReactNode
  valueClassName?: string
  onClick?: () => void
  ariaLabel?: string
}) {
  const body = (
    <>
      <p className="flex items-center justify-between gap-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
        <span>{label}</span>
        {onClick ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      </p>
      <p className={cn('serif-num mt-0.5 text-2xl', valueClassName ?? 'text-ink')}>{value}</p>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="rounded-input bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {body}
      </button>
    )
  }
  return <div className="rounded-input bg-surface-2 px-3 py-2.5">{body}</div>
}

/* ── sessions sub-view ───────────────────────────────────── */

function SessionsView({
  profile,
  onBack,
  onClose,
}: {
  profile: ClientProfileResponse
  onBack(): void
  onClose(): void
}) {
  const t = useT()
  const navigate = useNavigate()
  const sessions = useMemo(
    () => profile.recent_cards.map(parseCard).filter((c) => c.sessionId),
    [profile.recent_cards],
  )

  const goSession = (id: string) => {
    onClose()
    navigate(`/sessions/${id}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('clients.profile.backToProfile')}
          className="grid h-8 w-8 place-items-center rounded-tag text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">
            {profile.name ?? t('clients.client', { id: profile.telegram_id })}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t('clients.profile.sessionsTitle')} · {profile.sessions_count}
          </p>
        </div>
      </header>

      {sessions.length === 0 ? (
        <p className="py-3 text-sm text-muted">{t('clients.profile.noSessions')}</p>
      ) : (
        <ul
          className="flex list-none flex-col gap-2 p-0"
          data-testid="client-sessions"
        >
          {sessions.map((s, i) => (
            <li key={s.sessionId ?? `s-${i}`}>
              <SessionRow card={s} onPick={() => s.sessionId && goSession(s.sessionId)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SessionRow({ card, onPick }: { card: ParsedCard; onPick(): void }) {
  const t = useT()
  const lang = useLanguage()
  const sentiment = card.sentiment?.toLowerCase()
  const sentimentLabelKey = sentiment ? SENTIMENT_LABEL_KEY[sentiment] : undefined
  const sentimentLabel = sentimentLabelKey ? t(sentimentLabelKey) : null
  const date = formatCardDate(card.createdAt, lang)
  const summary = card.summary
    ? card.summary.length > 110
      ? `${card.summary.slice(0, 110)}…`
      : card.summary
    : null

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full flex-col gap-1.5 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {sentiment && sentimentLabel ? (
            <span
              className={cn(
                'inline-flex rounded-tag px-2 py-0.5 text-[11px] font-medium',
                SENTIMENT_CLASS[sentiment] ?? 'bg-surface-2 text-muted',
              )}
            >
              {sentimentLabel}
            </span>
          ) : null}
          {date ? <span className="text-[12px] text-muted">{date}</span> : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-2" aria-hidden="true" />
      </div>
      {summary ? (
        <p className="text-[13px] leading-snug text-ink-2">{summary}</p>
      ) : (
        <p className="text-[12.5px] italic text-muted">{t('clients.card.noDescription')}</p>
      )}
      {card.topics.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {card.topics.slice(0, 6).map((tp) => (
            <span
              key={tp}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2"
            >
              {tp}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  )
}

/* ── recent feedback card (was JSON dump) ────────────────── */

interface ParsedCard {
  sessionId: string | null
  createdAt: string | null
  summary: string | null
  sentiment: string | null
  topics: string[]
  extras: Array<[string, string]>
}

const CARD_PRIMARY_FIELDS = new Set([
  'session_id',
  'summary_text',
  'created_at',
  'sentiment',
  'topics',
  'embedding',
  'embedding_id',
])

function asString(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((it) => (typeof it === 'string' ? it : it != null ? String(it) : ''))
    .filter(Boolean)
}

function parseCard(raw: Record<string, unknown>): ParsedCard {
  return {
    sessionId: asString(raw['session_id']),
    createdAt: asString(raw['created_at']),
    summary: asString(raw['summary_text']),
    sentiment: asString(raw['sentiment']),
    topics: asStringArray(raw['topics']),
    extras: Object.entries(raw)
      .filter(([k, v]) => !CARD_PRIMARY_FIELDS.has(k) && v != null && v !== '')
      .slice(0, 5)
      .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
  }
}

function cardKey(raw: Record<string, unknown>, fallback: number): string {
  const id = asString(raw['session_id'])
  return id ?? `card-${fallback}`
}

const SENTIMENT_CLASS: Record<string, string> = {
  positive: 'bg-mint/15 text-success',
  neutral: 'bg-surface-2 text-muted',
  negative: 'bg-rose/15 text-danger',
}

const SENTIMENT_LABEL_KEY: Record<string, TranslationKey> = {
  positive: 'clients.cardSentiment.positive',
  neutral: 'clients.cardSentiment.neutral',
  negative: 'clients.cardSentiment.negative',
}

function RecentCardItem({ card }: { card: Record<string, unknown> }) {
  const t = useT()
  const lang = useLanguage()
  const parsed = parseCard(card)
  const sentiment = parsed.sentiment?.toLowerCase()
  const sentimentLabelKey = sentiment ? SENTIMENT_LABEL_KEY[sentiment] : undefined
  const sentimentLabel = sentimentLabelKey ? t(sentimentLabelKey) : null
  const date = formatCardDate(parsed.createdAt, lang)

  return (
    <article className="rounded-card border border-line bg-surface p-3.5">
      <header className="flex flex-wrap items-center gap-2">
        {sentiment && sentimentLabel ? (
          <span
            className={cn(
              'inline-flex rounded-tag px-2 py-0.5 text-[11px] font-medium',
              SENTIMENT_CLASS[sentiment] ?? 'bg-surface-2 text-muted',
            )}
          >
            {sentimentLabel}
          </span>
        ) : null}
        {date ? <span className="text-[12px] text-muted">{date}</span> : null}
      </header>

      {parsed.summary ? (
        <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.5] text-ink">
          {parsed.summary}
        </p>
      ) : (
        <p className="mt-2 text-[13px] italic text-muted">{t('clients.card.noDescription')}</p>
      )}

      {parsed.topics.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {parsed.topics.slice(0, 8).map((tp) => (
            <span
              key={tp}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2"
            >
              {tp}
            </span>
          ))}
        </div>
      ) : null}

      {parsed.extras.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-0.5 border-t border-line pt-2 text-[11.5px] text-muted">
          {parsed.extras.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="shrink-0 font-mono text-muted-2">{k}</dt>
              <dd className="min-w-0 flex-1 truncate text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  )
}

function formatCardDate(iso: string | null, lang: Parameters<typeof dateLocale>[0]): string | null {
  if (!iso) return null
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso.slice(0, 10)
  return dt.toLocaleString(dateLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
