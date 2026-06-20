import { ClientAvatar } from '@/components/clients/ClientAvatar'
import { useT, useLanguage, dateLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { ClientRef } from '@/lib/api/types'

/**
 * Presentational list of clients shared by every drill-down (topic →
 * clients, category → clients, name/topic filters). A tap surfaces the
 * client's `telegram_id` so the caller can open the profile sheet.
 */
export function ClientList({
  clients,
  onPick,
}: {
  clients: ClientRef[]
  onPick(telegramId: number): void
}) {
  return (
    <ul className="flex list-none flex-col gap-2 p-0" data-testid="client-list">
      {clients.map((c) => (
        <li key={c.telegram_id}>
          <ClientRow client={c} onPick={() => onPick(c.telegram_id)} />
        </li>
      ))}
    </ul>
  )
}

function ClientRow({ client, onPick }: { client: ClientRef; onPick(): void }) {
  const t = useT()
  const lang = useLanguage()
  const tone: 'positive' | 'negative' | 'neutral' | 'brand' =
    client.avg_sentiment == null
      ? 'brand'
      : client.avg_sentiment > 0.33
        ? 'positive'
        : client.avg_sentiment < -0.33
          ? 'negative'
          : 'neutral'
  const name = client.name ?? t('clients.client', { id: client.telegram_id })
  const last = client.last_session_at
    ? new Date(client.last_session_at).toLocaleDateString(dateLocale(lang), {
        day: '2-digit',
        month: 'short',
      })
    : '—'

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
    >
      <ClientAvatar name={client.name} telegramId={client.telegram_id} tone={tone} size={40} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{name}</span>
          <span className="shrink-0 whitespace-nowrap font-mono text-[11.5px] text-muted-2">
            {last}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span>
            {client.sessions_count} {t('clients.list.sessions')}
          </span>
          {client.avg_sentiment != null ? (
            <span
              className={cn(
                'font-mono',
                tone === 'positive'
                  ? 'text-success'
                  : tone === 'negative'
                    ? 'text-danger'
                    : 'text-muted-2',
              )}
            >
              {client.avg_sentiment > 0 ? '+' : ''}
              {client.avg_sentiment.toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
