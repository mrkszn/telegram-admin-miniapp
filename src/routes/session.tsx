import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BackButton } from '@/components/layout/BackButton'
import { Message } from '@/components/chat/Message'
import { AskAiMarker } from '@/components/chat/AskAiMarker'
import { SentimentChip } from '@/components/sessions/SentimentChip'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useApi } from '@/lib/hooks/useApi'
import { useFallbackBack } from '@/lib/hooks/useFallbackBack'
import { fetchSessionDetail } from '@/lib/api/admin'
import { useT, useLanguage, dateLocale } from '@/lib/i18n'
import type { SessionAnswer, SessionDetail, SessionMessage } from '@/lib/api/types'

export function SessionRoute() {
  const t = useT()
  const { id = '' } = useParams<{ id: string }>()
  // Falls back to /dashboard when /sessions/:id is a deep-link entry with
  // no history to pop — otherwise navigate(-1) would no-op and the user
  // would be stranded (hamburger is suppressed when onBack is set).
  const goBack = useFallbackBack('/dashboard')

  const { data, error, isLoading, refetch } = useApi<SessionDetail>(
    id ? `session|${id}` : null,
    id ? () => fetchSessionDetail(id) : null,
  )

  return (
    <AppShell title={t('session.title')} headerRight={null} onBack={goBack}>
      <BackButton onClick={goBack} />
      <div className="flex flex-col gap-5">
        {error ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <div className="flex justify-center py-16">
            <BrandSpinner size="lg" label={t('session.loading')} />
          </div>
        ) : (
          <SessionDetailView detail={data} />
        )}
      </div>
    </AppShell>
  )
}

function SessionDetailView({ detail }: { detail: SessionDetail }) {
  const t = useT()
  const lang = useLanguage()
  const name =
    detail.client_name ??
    (detail.client_id != null
      ? t('clients.client', { id: detail.client_id })
      : t('clients.anon'))
  const started = new Date(detail.started_at).toLocaleString(dateLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 flex-1 truncate font-serif text-xl text-ink">{name}</h2>
          <SentimentChip sentiment={detail.sentiment} />
        </div>
        <p className="font-mono text-[12.5px] text-muted-2">{started}</p>
        {detail.topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {detail.topics.map((tp) => (
              <span
                key={tp}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2"
              >
                {tp}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {sections(detail, t).map((section, i) => (
        <Section key={section.key} index={i + 1} title={section.title}>
          {section.node}
        </Section>
      ))}
    </>
  )
}

function sections(
  detail: SessionDetail,
  t: ReturnType<typeof useT>,
): Array<{ key: string; title: string; node: React.ReactNode }> {
  const out: Array<{ key: string; title: string; node: React.ReactNode }> = []

  if (detail.summary) {
    const summaryText = detail.summary
    out.push({
      key: 'summary',
      title: t('session.summary'),
      node: (
        <div className="relative rounded-card border border-line bg-surface p-3.5">
          <p className="whitespace-pre-line pr-9 text-[14px] leading-[1.5] text-ink">
            {summaryText}
          </p>
          <AskAiMarker
            question={t('askAi.summary', { text: summaryText })}
            className="absolute right-2 top-2"
          />
        </div>
      ),
    })
  }

  if (detail.answers.length > 0) {
    out.push({
      key: 'answers',
      title: t('session.answers'),
      node: (
        <div className="flex flex-col gap-2">
          {detail.answers.map((a, i) => (
            <AnswerRow key={`${a.question_text}|${i}`} answer={a} />
          ))}
        </div>
      ),
    })
  }

  out.push({
    key: 'transcript',
    title: t('session.transcript'),
    node:
      detail.messages.length === 0 ? (
        <p className="text-sm text-muted">{t('session.noMessages')}</p>
      ) : (
        <ol className="flex list-none flex-col gap-3 p-0" data-testid="session-transcript">
          {detail.messages.map((m, i) => (
            <li key={`${m.created_at ?? ''}|${i}`}>
              <Message role={messageRole(m)} content={m.content} />
            </li>
          ))}
        </ol>
      ),
  })

  return out
}

function messageRole(m: SessionMessage): 'user' | 'agent' {
  return m.role === 'user' ? 'user' : 'agent'
}

function AnswerRow({ answer }: { answer: SessionAnswer }) {
  const t = useT()
  const marked = coerceText(answer.marked_value)
  const askText = answer.answer_text ?? marked ?? ''
  return (
    <div className="relative rounded-card border border-line bg-surface p-3">
      <p className="pr-9 text-[13px] font-medium text-ink">{answer.question_text}</p>
      {answer.answer_text ? (
        <p className="mt-1 whitespace-pre-line text-[13px] leading-snug text-ink-2">
          {answer.answer_text}
        </p>
      ) : null}
      {marked ? (
        <span className="mt-2 inline-flex rounded-tag bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-on-soft">
          {marked}
        </span>
      ) : null}
      {askText ? (
        <AskAiMarker
          question={t('askAi.answer', {
            question: answer.question_text,
            answer: askText,
          })}
          className="absolute right-2 top-2"
        />
      ) : null}
    </div>
  )
}

/**
 * Render an unknown backend value (e.g. `marked_value`, typed `Any`) as text.
 * Objects like `{ value: … }` would otherwise crash React (#31 — "objects are
 * not valid as a React child"), so we unwrap the common scalar shapes and fall
 * back to JSON for anything else.
 */
function coerceText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    for (const key of ['value', 'label', 'text', 'name', 'title'] as const) {
      const inner = o[key]
      if (typeof inner === 'string' || typeof inner === 'number') return String(inner)
    }
    try {
      return JSON.stringify(v)
    } catch {
      return null
    }
  }
  return String(v)
}

function Section({
  index,
  title,
  children,
}: {
  index: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <header className="flex items-baseline gap-2">
        <span className="serif-num text-base text-muted-2">
          {String(index).padStart(2, '0')}
        </span>
        <h3 className="font-serif text-lg text-ink">{title}</h3>
      </header>
      {children}
    </section>
  )
}
