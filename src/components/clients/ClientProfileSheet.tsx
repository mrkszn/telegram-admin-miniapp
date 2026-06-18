import { useEffect, useState, type ReactNode } from 'react'
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

  useEffect(() => {
    if (telegramId == null) {
      setProfile(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
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
          <SheetTitle className="sr-only">{t('clients.profile.title')}</SheetTitle>
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
          <ProfileBody profile={profile} />
        ) : (
          <p className="py-3 text-sm text-muted">{t('clients.profile.notFound')}</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ProfileBody({ profile }: { profile: ClientProfileResponse }) {
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
}: {
  label: ReactNode
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="rounded-input bg-surface-2 px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</p>
      <p className={cn('serif-num mt-0.5 text-2xl', valueClassName ?? 'text-ink')}>{value}</p>
    </div>
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
