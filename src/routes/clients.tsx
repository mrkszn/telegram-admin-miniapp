import { useCallback, useEffect, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
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
      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" strokeWidth={1.75} aria-hidden="true" />
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
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" strokeWidth={1.75} />
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
        <ProfileStat label="Сессий" value={profile.sessions_count.toString()} />
        <ProfileStat
          label="Sentiment"
          valueClassName={sentColor}
          value={
            profile.avg_sentiment != null
              ? `${profile.avg_sentiment > 0 ? '+' : ''}${profile.avg_sentiment.toFixed(2)}`
              : '—'
          }
        />
      </div>

      {profile.top_topics.length > 0 ? (
        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Топики
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.top_topics.slice(0, 6).map((t) => (
              <span
                key={t.topic}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2"
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
              <pre
                key={i}
                className="m-0 overflow-x-auto whitespace-pre-wrap break-words rounded-card border border-line bg-surface p-3 font-mono text-[11.5px] leading-[17px] text-ink-2"
              >
                {JSON.stringify(card, null, 2)}
              </pre>
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
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-input bg-surface-2 px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</p>
      <p className={cn('serif-num mt-0.5 text-2xl', valueClassName ?? 'text-ink')}>{value}</p>
    </div>
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
