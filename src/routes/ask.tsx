import { useCallback, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ChatWidget, type ChatMessage, type ChatWidgetHandle } from '@/components/chat/ChatWidget'
import { ErrorState } from '@/components/feedback/ErrorState'
import { askAdmin } from '@/lib/api/admin'
import { bootstrapAuth } from '@/lib/telegram/auth'
import { toApiError } from '@/lib/api/client'
import type { AskHistoryItem, AskResponse } from '@/lib/api/types'
import { ADMIN_NAV } from './nav'

const SUGGESTED_PROMPTS = [
  'Топ-3 жалобы за неделю',
  'Сводка за 30 дней',
  'Что хвалят клиенты',
  'Найди жалобы на скорость',
]

/** How many prior messages are passed back to the agent as context. */
const HISTORY_WINDOW = 6

function nextId(): string {
  // crypto.randomUUID is available in jsdom and browsers; safe fallback.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `m-${Math.random().toString(36).slice(2, 10)}`
}

export function AskRoute() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const chatRef = useRef<ChatWidgetHandle>(null)

  useEffect(() => {
    chatRef.current?.scrollToBottom()
  }, [messages, isBusy])

  const send = useCallback(
    async (question: string) => {
      const userMsg: ChatMessage = { id: nextId(), role: 'user', content: question }
      const history = buildHistory([...messages, userMsg])
      setMessages((prev) => [...prev, userMsg])
      setIsBusy(true)
      setError(null)
      try {
        const res = await submitAskWithRetry(question, history)
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'agent',
            content: res.answer_text,
            chart: res.chart_text ? <ChartPre text={res.chart_text} /> : undefined,
          },
        ])
      } catch (err) {
        const apiErr = toApiError(err)
        setError(apiErr.message || 'Не удалось получить ответ.')
      } finally {
        setIsBusy(false)
      }
    },
    [messages],
  )

  return (
    <AppShell
      title="Чат"
      navItems={ADMIN_NAV}
      contentClassName="flex flex-col gap-0 px-3 py-0"
    >
      <div className="flex h-[calc(100vh-44px-56px)] flex-col">
        {error ? (
          <div className="px-1 pt-3">
            <ErrorState message={error} />
          </div>
        ) : null}
        <ChatWidget
          ref={chatRef}
          className="flex-1"
          messages={messages}
          onSubmit={(text) => void send(text)}
          isBusy={isBusy}
          placeholder="Спросите про метрики или клиентов…"
          emptyState={<SuggestedPrompts onPick={(p) => void send(p)} />}
        />
      </div>
    </AppShell>
  )
}

/* ── helpers ────────────────────────────────────────────── */

function ChartPre({ text }: { text: string }) {
  return (
    <pre className="m-0 max-h-72 overflow-x-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-[12px] leading-[17px] text-ink-2">
      {text}
    </pre>
  )
}

function SuggestedPrompts({ onPick }: { onPick(p: string): void }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-3 text-center">
      <p className="font-serif text-[22px] leading-tight text-ink">
        Спросите о данных.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Агент сходит в метрики, топики и клиентов и вернёт сводку.
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Compose the trailing history window into the role/content pairs the
 * backend expects. The current user message is included; the agent
 * reply for *this* turn is not yet present.
 */
function buildHistory(messages: ChatMessage[]): AskHistoryItem[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'agent')
    .map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: typeof m.content === 'string' ? m.content : '',
    }))
    .slice(-HISTORY_WINDOW)
}

/**
 * Submit, and if the backend returns 401 (session expired), transparently
 * re-bootstrap auth and retry once. The user shouldn't notice.
 */
async function submitAskWithRetry(
  question: string,
  history: AskHistoryItem[],
): Promise<AskResponse> {
  try {
    return await askAdmin({ question, history })
  } catch (err) {
    const apiErr = toApiError(err)
    if (apiErr.status !== 401) throw err
    await bootstrapAuth({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
      authEndpoint: import.meta.env.VITE_AUTH_ENDPOINT ?? '/admin/auth',
    })
    return await askAdmin({ question, history })
  }
}
