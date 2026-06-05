import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { CountUp } from '@/components/feedback/CountUp'
import { AppShell } from '@/components/layout/AppShell'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ClientAvatar } from '@/components/clients/ClientAvatar'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { fetchClientProfile, semanticSearch } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import type {
  ApiError,
  ClientProfileResponse,
  SemanticHit,
  SemanticSearchResponse,
} from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

const SUGGESTIONS = [
  'жалобы на доставку',
  'хвалят сервис',
  'долгое ожидание',
  'постоянные гости',
]

export function ClientsRoute() {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)

  const [hits, setHits] = useState<SemanticHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  /* search effect — fires only when the debounced query is non-empty */
  useEffect(() => {
    let cancelled = false
    if (!debounced) {
      setHits([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    semanticSearch({ query: debounced, top_k: 10 })
      .then((res: SemanticSearchResponse) => {
        if (cancelled) return
        setHits(res.hits)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(toApiError(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debounced])

  const onSuggest = useCallback((s: string) => setQuery(s), [])

  return (
    <AppShell title="Клиенты" navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        <SearchInput value={query} onChange={setQuery} />

        {!debounced ? (
          <SuggestionsPanel onPick={onSuggest} />
        ) : loading ? (
          <SearchingHint />
        ) : error ? (
          <ErrorState onRetry={() => setQuery((q) => q + ' ')} />
        ) : hits.length === 0 ? (
          <p className="text-sm text-muted">Ничего не найдено.</p>
        ) : (
          <HitsSection hits={hits} onPick={(id) => setOpenId(id)} />
        )}
      </div>

      <ProfileSheet
        telegramId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
      />
    </AppShell>
  )
}

/* ── search input ───────────────────────────────────────── */

function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange(next: string): void
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Поиск клиентов"
        placeholder="Опишите, кого ищете…"
        className="h-11 rounded-input pl-9 pr-9 text-base"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Очистить запрос"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-input text-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function SuggestionsPanel({ onPick }: { onPick(s: string): void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif text-[22px] italic leading-tight text-ink">
        Спросите голосом владельца.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Семантический поиск ищет клиентов по смыслу запроса, не по имени или id.
      </p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function SearchingHint() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <BrandSpinner size="sm" />
      <span>Поиск…</span>
    </div>
  )
}

/* ── hit list ───────────────────────────────────────────── */

function HitsSection({
  hits,
  onPick,
}: {
  hits: SemanticHit[]
  onPick(clientId: number): void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
          {hits.length} {plural(hits.length, ['результат', 'результата', 'результатов'])}
        </span>
        <span className="font-serif text-[11.5px] italic text-muted-2">по смыслу</span>
      </div>
      <ul className="flex list-none flex-col gap-2 p-0" data-testid="hit-list">
        {hits.map((h) => (
          <li key={h.session_id}>
            <HitCard hit={h} onPick={() => h.client_id != null && onPick(h.client_id)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function HitCard({ hit, onPick }: { hit: SemanticHit; onPick(): void }) {
  const disabled = hit.client_id == null
  const tone: 'positive' | 'negative' | 'neutral' =
    hit.sentiment === 'positive'
      ? 'positive'
      : hit.sentiment === 'negative'
        ? 'negative'
        : 'neutral'
  const sentLabel =
    hit.sentiment === 'positive'
      ? 'позитив'
      : hit.sentiment === 'negative'
        ? 'негатив'
        : hit.sentiment === 'neutral'
          ? 'нейтрально'
          : '—'
  const sentChip = {
    positive: 'bg-mint/20 text-success',
    negative: 'bg-rose/20 text-danger',
    neutral: 'bg-surface-2 text-muted',
  }[tone]
  const date = hit.started_at
    ? new Date(hit.started_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
      })
    : ''
  const name = hit.client_id != null ? `Клиент ${hit.client_id}` : 'Аноним'
  const summary =
    hit.summary_text.length > 110
      ? `${hit.summary_text.slice(0, 110)}…`
      : hit.summary_text

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'flex w-full items-start gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors',
        disabled ? 'cursor-default opacity-60' : 'hover:border-line-strong',
      )}
    >
      <ClientAvatar name={null} telegramId={hit.client_id} tone={tone} size={40} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{name}</span>
          <span className="shrink-0 whitespace-nowrap font-mono text-[11.5px] text-muted-2">
            {date}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-tag px-2 py-0.5 text-[11px] font-semibold',
              sentChip,
            )}
          >
            {sentLabel}
          </span>
          <span className="serif-num text-sm text-brand">{hit.score.toFixed(2)}</span>
          <span className="font-mono text-[11px] text-muted-2">score</span>
        </div>
        <p className="text-[13px] leading-snug text-ink-2">{summary}</p>
      </div>
    </button>
  )
}

/* ── profile sheet ──────────────────────────────────────── */

function ProfileSheet({
  telegramId,
  onOpenChange,
}: {
  telegramId: number | null
  onOpenChange(open: boolean): void
}) {
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
          <SheetTitle className="sr-only">Профиль клиента</SheetTitle>
          <SheetDescription className="sr-only">
            Сводка по клиенту: количество сессий, средний sentiment, топики.
          </SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted">
            <BrandSpinner size="sm" />
            <span>Загрузка профиля…</span>
          </div>
        ) : error ? (
          <ErrorState message="Профиль не загрузился." />
        ) : profile ? (
          <ProfileBody profile={profile} />
        ) : (
          <p className="py-3 text-sm text-muted">Профиль не найден.</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ProfileBody({ profile }: { profile: ClientProfileResponse }) {
  const sentColor =
    profile.avg_sentiment == null
      ? 'text-ink'
      : profile.avg_sentiment > 0.33
        ? 'text-success'
        : profile.avg_sentiment < -0.33
          ? 'text-danger'
          : 'text-warning'
  const last = profile.last_session_at
    ? new Date(profile.last_session_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
      })
    : '—'
  const name = profile.name ?? `Клиент ${profile.telegram_id}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ClientAvatar name={profile.name} telegramId={profile.telegram_id} tone="brand" size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink">{name}</p>
          <p className="font-mono text-[12.5px] text-muted-2">
            telegram #{profile.telegram_id} · последняя сессия {last}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ProfileStat
          label="Сессий"
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
            Топики
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.top_topics.slice(0, 6).map((t, i) => (
              <span
                key={t.topic}
                className="animate-fade-rise rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                {t.topic}{' '}
                <span className="ml-1 font-mono text-muted-2">{t.count}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {profile.recent_cards.length > 0 ? (
        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Последние карточки
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
  label: string
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
  // these are useful but we already show via dedicated chips/sections
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

const SENTIMENT_LABEL: Record<string, string> = {
  positive: 'позитивный',
  neutral: 'нейтральный',
  negative: 'негативный',
}

const SENTIMENT_CLASS: Record<string, string> = {
  positive: 'bg-mint/15 text-success',
  neutral: 'bg-surface-2 text-muted',
  negative: 'bg-rose/15 text-danger',
}

function formatCardDate(iso: string | null): string | null {
  if (!iso) return null
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso.slice(0, 10)
  return dt.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RecentCardItem({ card }: { card: Record<string, unknown> }) {
  const parsed = parseCard(card)
  const sentiment = parsed.sentiment?.toLowerCase()
  const date = formatCardDate(parsed.createdAt)

  return (
    <article className="rounded-card border border-line bg-surface p-3.5">
      <header className="flex flex-wrap items-center gap-2">
        {sentiment && SENTIMENT_LABEL[sentiment] ? (
          <span
            className={cn(
              'inline-flex rounded-tag px-2 py-0.5 text-[11px] font-medium',
              SENTIMENT_CLASS[sentiment] ?? 'bg-surface-2 text-muted',
            )}
          >
            {SENTIMENT_LABEL[sentiment]}
          </span>
        ) : null}
        {date ? <span className="text-[12px] text-muted">{date}</span> : null}
      </header>

      {parsed.summary ? (
        <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.5] text-ink">
          {parsed.summary}
        </p>
      ) : (
        <p className="mt-2 text-[13px] italic text-muted">Без описания.</p>
      )}

      {parsed.topics.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {parsed.topics.slice(0, 8).map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2"
            >
              {t}
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

/* ── tiny utils ─────────────────────────────────────────── */

function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}
