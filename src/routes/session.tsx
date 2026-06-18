import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BackButton } from '@/components/layout/BackButton'
import { Message } from '@/components/chat/Message'
import { SentimentChip } from '@/components/sessions/SentimentChip'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useApi } from '@/lib/hooks/useApi'
import { fetchSessionDetail } from '@/lib/api/admin'
import { useT, useLanguage, dateLocale } from '@/lib/i18n'
import type { SessionAnswer, SessionDetail, SessionMessage } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

export function SessionRoute() {
  const t = useT()
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()
  const goBack = useCallback(() => navigate(-1), [navigate])

  const { data, error, isLoading, refetch } = useApi<SessionDetail>(
    id ? `session|${id}` : null,
    id ? () => fetchSessionDetail(id) : null,
  )

  return (
    <AppShell
      title={t('session.title')}
      navItems={ADMIN_NAV}
      headerRight={null}
      onBack={goBack}
    >
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
    out.push({
      key: 'summary',
      title: t('session.summary'),
      node: (
        <p className="whitespace-pre-line rounded-card border border-line bg-surface p-3.5 text-[14px] leading-[1.5] text-ink">
          {detail.summary}
        </p>
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
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <p className="text-[13px] font-medium text-ink">{answer.question_text}</p>
      <p className="mt-1 whitespace-pre-line text-[13px] leading-snug text-ink-2">
        {answer.answer_text}
      </p>
      {answer.marked_value ? (
        <span className="mt-2 inline-flex rounded-tag bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-deep">
          {answer.marked_value}
        </span>
      ) : null}
    </div>
  )
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
