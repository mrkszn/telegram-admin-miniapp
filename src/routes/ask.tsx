import { useCallback, useEffect, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ChatWidget, type ChatMessage, type ChatWidgetHandle } from '@/components/chat/ChatWidget'
import { ChartFromText } from '@/components/chat/ChartFromText'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useChatStore, type StoredChatMessage } from '@/lib/state/chat-store'
import { ADMIN_NAV } from './nav'

const SUGGESTED_PROMPTS = [
  'Топ-3 жалобы за неделю',
  'Сводка за 30 дней',
  'Что хвалят клиенты',
  'Найди жалобы на скорость',
]

/**
 * Hydrate a stored message (just strings, lives in localStorage) into a
 * ChatWidget message (React tree, ChartFromText for the chart slot).
 */
function hydrate(stored: StoredChatMessage): ChatMessage {
  return {
    id: stored.id,
    role: stored.role,
    content: stored.content,
    chart: stored.chartText ? <ChartFromText text={stored.chartText} /> : undefined,
  }
}

export function AskRoute() {
  const messages = useChatStore((s) => s.messages)
  const isBusy = useChatStore((s) => s.isBusy)
  const error = useChatStore((s) => s.error)
  const send = useChatStore((s) => s.send)
  const clearError = useChatStore((s) => s.clearError)
  const chatRef = useRef<ChatWidgetHandle>(null)

  useEffect(() => {
    chatRef.current?.scrollToBottom()
  }, [messages, isBusy])

  const handleSubmit = useCallback(
    (question: string) => {
      // send() is fire-and-forget from the UI's POV — the store flips
      // busy/messages synchronously, the agent reply lands later even if
      // we've navigated away. Float the promise so React's linter is happy
      // without blocking the input.
      void send(question)
    },
    [send],
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
            <ErrorState message={error} onRetry={clearError} />
          </div>
        ) : null}
        <ChatWidget
          ref={chatRef}
          className="flex-1"
          messages={messages.map(hydrate)}
          onSubmit={handleSubmit}
          isBusy={isBusy}
          placeholder="Спросите про метрики или клиентов…"
          emptyState={<SuggestedPrompts onPick={(p) => void send(p)} />}
        />
      </div>
    </AppShell>
  )
}

/* ── helpers ────────────────────────────────────────────── */

function SuggestedPrompts({ onPick }: { onPick(p: string): void }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-3 text-center">
      <p className="font-serif text-[22px] leading-tight text-ink">
        Спросите о данных.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Агент сходит в метрики, топики и клиентов и вернёт сводку.
        Можно уйти на другую вкладку, пока он считает — ответ дождётся вас здесь.
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
