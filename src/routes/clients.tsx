import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { AppShell } from '@/components/layout/AppShell'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented'
import { ClientAvatar } from '@/components/clients/ClientAvatar'
import { ClientList } from '@/components/clients/ClientList'
import { ClientProfileSheet } from '@/components/clients/ClientProfileSheet'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useApi } from '@/lib/hooks/useApi'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePersistentState } from '@/lib/hooks/usePersistentState'
import {
  fetchClientsByQuery,
  fetchClientsByTopics,
  fetchTopics,
  semanticSearch,
} from '@/lib/api/admin'
import { resolveRange } from '@/lib/date-range'
import { toApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { useT, useLanguage, dateLocale, type TranslationKey } from '@/lib/i18n'
import type {
  ApiError,
  ClientRef,
  ClientsMatch,
  ClientsResponse,
  SemanticHit,
  SemanticSearchResponse,
  TopicsResponse,
} from '@/lib/api/types'

type SearchMode = 'semantic' | 'name' | 'topics'

const SUGGESTION_KEYS: TranslationKey[] = [
  'clients.suggestion.1',
  'clients.suggestion.2',
  'clients.suggestion.3',
  'clients.suggestion.4',
]

export function ClientsRoute() {
  const t = useT()
  const [mode, setMode] = usePersistentState<SearchMode>(
    'clients_mode',
    'semantic',
    (v): v is SearchMode => v === 'semantic' || v === 'name' || v === 'topics',
  )
  const [openId, setOpenId] = useState<number | null>(null)

  const modeOptions: { value: SearchMode; label: string }[] = [
    { value: 'semantic', label: t('clients.mode.semantic') },
    { value: 'name', label: t('clients.mode.name') },
    { value: 'topics', label: t('clients.mode.topics') },
  ]

  return (
    <AppShell title={t('title.clients')}>
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label={t('clients.mode.aria')}
          options={modeOptions}
          value={mode}
          onChange={(m) => setMode(m)}
        />

        {mode === 'semantic' ? (
          <SemanticPanel onPick={setOpenId} />
        ) : mode === 'name' ? (
          <NamePanel onPick={setOpenId} />
        ) : (
          <TopicsPanel onPick={setOpenId} />
        )}
      </div>

      <ClientProfileSheet
        telegramId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
      />
    </AppShell>
  )
}

/* ── semantic search (unchanged behaviour) ──────────────── */

function SemanticPanel({ onPick }: { onPick(telegramId: number): void }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const [hits, setHits] = useState<SemanticHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

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
    <>
      <SearchField
        value={query}
        onChange={setQuery}
        ariaLabel={t('clients.search.aria')}
        placeholder={t('clients.search.placeholder')}
      />
      {!debounced ? (
        <SuggestionsPanel onPick={onSuggest} />
      ) : loading ? (
        <SearchingHint />
      ) : error ? (
        <ErrorState onRetry={() => setQuery((q) => q + ' ')} />
      ) : hits.length === 0 ? (
        <p className="text-sm text-muted">{t('clients.nothingFound')}</p>
      ) : (
        <HitsSection hits={hits} onPick={onPick} />
      )}
    </>
  )
}

/* ── name / id lookup ───────────────────────────────────── */

function NamePanel({ onPick }: { onPick(telegramId: number): void }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const active = debounced.length > 0

  const { data, error, isLoading } = useApi<ClientsResponse>(
    active ? `clients|name|${debounced}` : null,
    active ? () => fetchClientsByQuery(debounced) : null,
  )

  const deduped = useMemo<ClientsResponse | null>(
    () => (data ? { clients: dedupeClientsByName(data.clients) } : null),
    [data],
  )

  return (
    <>
      <SearchField
        value={query}
        onChange={setQuery}
        ariaLabel={t('clients.byName.aria')}
        placeholder={t('clients.byName.placeholder')}
      />
      {!active ? (
        <p className="text-sm leading-relaxed text-muted">{t('clients.byName.hint')}</p>
      ) : (
        <ClientResults data={deduped} error={error} isLoading={isLoading} onPick={onPick} />
      )}
    </>
  )
}

/**
 * Collapse multiple result rows for the same person into one. Backend can
 * return one row per visited "name match" key, so the UI was showing the same
 * client several times; group by normalised name and keep the most-active
 * `telegram_id` as the representative, summing sessions and weighting the
 * average sentiment by session count.
 */
function dedupeClientsByName(clients: ClientRef[]): ClientRef[] {
  const groups = new Map<string, ClientRef[]>()
  const order: string[] = []
  for (const c of clients) {
    const key = normaliseKey(c)
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(c)
    } else {
      groups.set(key, [c])
      order.push(key)
    }
  }
  return order.map((key) => mergeClientGroup(groups.get(key)!))
}

function normaliseKey(c: ClientRef): string {
  const name = c.name?.trim().toLowerCase()
  return name && name.length > 0 ? `name:${name}` : `id:${c.telegram_id}`
}

function mergeClientGroup(group: ClientRef[]): ClientRef {
  const [first, ...rest] = group
  if (!first) throw new Error('mergeClientGroup called with empty group')
  if (rest.length === 0) return first
  const primary = group.reduce((best, c) => {
    const bestScore = best.sessions_count ?? 0
    const cScore = c.sessions_count ?? 0
    if (cScore !== bestScore) return cScore > bestScore ? c : best
    const bestWhen = new Date(best.last_session_at ?? 0).getTime()
    const cWhen = new Date(c.last_session_at ?? 0).getTime()
    return cWhen > bestWhen ? c : best
  }, first)
  const sessions_count = group.reduce((s, c) => s + (c.sessions_count ?? 0), 0)
  const weightedSum = group.reduce(
    (s, c) => (c.avg_sentiment != null ? s + c.avg_sentiment * (c.sessions_count ?? 0) : s),
    0,
  )
  const weight = group.reduce(
    (s, c) => (c.avg_sentiment != null ? s + (c.sessions_count ?? 0) : s),
    0,
  )
  const avg_sentiment = weight > 0 ? weightedSum / weight : primary.avg_sentiment
  const last_session_at =
    group
      .map((c) => c.last_session_at)
      .filter((x): x is string => !!x)
      .sort()
      .at(-1) ?? null
  return {
    telegram_id: primary.telegram_id,
    name: primary.name,
    sessions_count,
    avg_sentiment,
    last_session_at,
  }
}

/* ── topic multi-filter ─────────────────────────────────── */

function TopicsPanel({ onPick }: { onPick(telegramId: number): void }) {
  const t = useT()
  const range = useMemo(() => resolveRange('90d'), [])
  const [selected, setSelected] = usePersistentState<string[]>(
    'client_topic_filters',
    [],
    (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
  )
  const [match, setMatch] = usePersistentState<ClientsMatch>(
    'client_topic_match',
    'and',
    (v): v is ClientsMatch => v === 'and' || v === 'or',
  )

  const { data: topicsData } = useApi<TopicsResponse>('clients|topic-universe', () =>
    fetchTopics({ date_from: range.date_from, date_to: range.date_to }),
  )
  const universe = topicsData?.topics ?? []

  const toggle = useCallback(
    (topic: string) => {
      setSelected((prev) =>
        prev.includes(topic) ? prev.filter((x) => x !== topic) : [...prev, topic],
      )
    },
    [setSelected],
  )

  const active = selected.length > 0
  const sortedKey = [...selected].sort().join('|')
  const { data, error, isLoading } = useApi<ClientsResponse>(
    active ? `clients|topics|${match}|${sortedKey}` : null,
    active ? () => fetchClientsByTopics(selected, match) : null,
  )

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t('clients.byTopics.title')}
          </span>
          <MatchToggle value={match} onChange={setMatch} />
        </div>

        {universe.length === 0 ? (
          <p className="text-sm text-muted">{t('common.noData')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {universe.map((tp) => {
              const on = selected.includes(tp.topic)
              return (
                <button
                  key={tp.topic}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(tp.topic)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                    on
                      ? 'border-brand bg-brand text-brand-on'
                      : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                  )}
                >
                  {tp.topic}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!active ? (
        <p className="text-sm leading-relaxed text-muted">{t('clients.byTopics.hint')}</p>
      ) : (
        <ClientResults data={data} error={error} isLoading={isLoading} onPick={onPick} />
      )}
    </>
  )
}

function MatchToggle({
  value,
  onChange,
}: {
  value: ClientsMatch
  onChange(next: ClientsMatch): void
}) {
  const t = useT()
  const options: { value: ClientsMatch; label: string }[] = [
    { value: 'and', label: t('clients.match.and') },
    { value: 'or', label: t('clients.match.or') },
  ]
  return (
    <div
      role="group"
      aria-label={t('clients.match.aria')}
      className="inline-flex rounded-full border border-line bg-surface p-0.5"
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-6 rounded-full px-2.5 text-[12px] font-medium uppercase transition-colors',
              on ? 'bg-brand text-brand-on' : 'text-muted',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── shared results ─────────────────────────────────────── */

function ClientResults({
  data,
  error,
  isLoading,
  onPick,
}: {
  data: ClientsResponse | null
  error: ApiError | null
  isLoading: boolean
  onPick(telegramId: number): void
}) {
  const t = useT()
  if (error) return <ErrorState />
  if (isLoading || !data) return <SearchingHint />
  if (data.clients.length === 0) {
    return <p className="text-sm text-muted">{t('clients.nothingFound')}</p>
  }
  return <ClientList clients={data.clients} onPick={onPick} />
}

/* ── small building blocks ──────────────────────────────── */

function SearchField({
  value,
  onChange,
  ariaLabel,
  placeholder,
}: {
  value: string
  onChange(next: string): void
  ariaLabel: string
  placeholder: string
}) {
  const t = useT()
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
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="h-11 rounded-input pl-9 pr-9 text-base"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('clients.search.clear')}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-input text-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function SuggestionsPanel({ onPick }: { onPick(s: string): void }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif text-[22px] italic leading-tight text-ink">
        {t('clients.askOwner')}
      </p>
      <p className="text-sm leading-relaxed text-muted">{t('clients.semanticHint')}</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((key) => {
          const suggestion = t(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(suggestion)}
              className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              {suggestion}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SearchingHint() {
  const t = useT()
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <BrandSpinner size="sm" />
      <span>{t('clients.searching')}</span>
    </div>
  )
}

/* ── semantic hit list ──────────────────────────────────── */

function HitsSection({
  hits,
  onPick,
}: {
  hits: SemanticHit[]
  onPick(clientId: number): void
}) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
          {hits.length} {t('clients.results', { count: hits.length })}
        </span>
        <span className="font-serif text-[11.5px] italic text-muted-2">
          {t('clients.byMeaning')}
        </span>
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
  const t = useT()
  const lang = useLanguage()
  const disabled = hit.client_id == null
  const tone: 'positive' | 'negative' | 'neutral' =
    hit.sentiment === 'positive'
      ? 'positive'
      : hit.sentiment === 'negative'
        ? 'negative'
        : 'neutral'
  const sentLabel =
    hit.sentiment === 'positive'
      ? t('sentiment.positive')
      : hit.sentiment === 'negative'
        ? t('sentiment.negative')
        : hit.sentiment === 'neutral'
          ? t('sentiment.neutral')
          : '—'
  const sentChip = {
    positive: 'bg-mint/20 text-success',
    negative: 'bg-rose/20 text-danger',
    neutral: 'bg-surface-2 text-muted',
  }[tone]
  const date = hit.started_at
    ? new Date(hit.started_at).toLocaleDateString(dateLocale(lang), {
        day: '2-digit',
        month: 'short',
      })
    : ''
  const name =
    hit.client_id != null ? t('clients.client', { id: hit.client_id }) : t('clients.anon')
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
          <span className="serif-num text-sm text-brand-text">{hit.score.toFixed(2)}</span>
          <span className="font-mono text-[11px] text-muted-2">score</span>
        </div>
        <p className="text-[13px] leading-snug text-ink-2">{summary}</p>
      </div>
    </button>
  )
}
