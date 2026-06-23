import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ChatWidget, type ChatMessage, type ChatWidgetHandle } from '@/components/chat/ChatWidget'
import { ChartFromText } from '@/components/chat/ChartFromText'
import { ErrorState } from '@/components/feedback/ErrorState'
import { BgBubbles } from '@/components/feedback/BgBubbles'
import { BrandMark } from '@/components/brand/BrandMark'
import { useChatStore, type StoredChatMessage } from '@/lib/state/chat-store'
import { useT, type TranslationKey } from '@/lib/i18n'

const SUGGESTED_PROMPT_KEYS: TranslationKey[] = [
  'ask.prompt.1',
  'ask.prompt.2',
  'ask.prompt.3',
  'ask.prompt.4',
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

/**
 * Chat-first landing. Replaces the old /dashboard splash: the user lands
 * directly into the conversation, with suggestion chips for the common
 * drill-downs and the agent's bubble flanked by the InsightFlow mark.
 *
 * Header CTA = "New chat" (only enabled when there's history to clear);
 * every other route is one hamburger-tap away via the drawer.
 */
export function ChatRoute() {
  const t = useT()
  const messages = useChatStore((s) => s.messages)
  const isBusy = useChatStore((s) => s.isBusy)
  const error = useChatStore((s) => s.error)
  const send = useChatStore((s) => s.send)
  const clearError = useChatStore((s) => s.clearError)
  const clearChat = useChatStore((s) => s.clearChat)
  const consumeQueued = useChatStore((s) => s.consumeQueued)
  const chatRef = useRef<ChatWidgetHandle>(null)

  // Flush any question queued by an AskAiMarker on another tab — fires once
  // per mount, with a busy guard so a slow agent reply doesn't get hijacked.
  useEffect(() => {
    const queued = consumeQueued()
    if (queued) void send(queued)
  }, [consumeQueued, send])

  useEffect(() => {
    chatRef.current?.scrollToBottom()
  }, [messages, isBusy])

  const handleSubmit = useCallback(
    (question: string) => {
      void send(question)
    },
    [send],
  )

  const hasHistory = messages.length > 0
  // Memoised so chart-bearing messages don't get fresh React identities on
  // every parent re-render (each new <ChartFromText/> would otherwise
  // re-mount the lazy chart chunk).
  const hydrated = useMemo(() => messages.map(hydrate), [messages])
  // Only allocate the empty-state tree before there's any history — after
  // the first message it's wasted work on every keystroke.
  const emptyState = hasHistory ? undefined : (
    <EmptyState onPick={(p) => void send(p)} />
  )

  return (
    <AppShell
      title={t('title.chat')}
      contentClassName="flex flex-col gap-0 p-0 min-h-0"
      headerRight={
        hasHistory ? (
          <button
            type="button"
            onClick={() => clearChat()}
            aria-label={t('ask.newChat')}
            title={t('ask.newChat')}
            className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-tag text-ink transition-colors hover:bg-surface-2"
          >
            <Plus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null
      }
    >
      {/* `isolate` opens a stacking context so BgBubbles' -z-10 stays inside
          this layer instead of escaping past the page background. */}
      <div className="relative isolate flex min-h-0 flex-1 flex-col">
        <BgBubbles visible={!hasHistory && !isBusy} />
        {error ? (
          <div className="px-3 pt-3">
            <ErrorState message={error} onRetry={clearError} />
          </div>
        ) : null}
        <ChatWidget
          ref={chatRef}
          className="flex-1"
          messages={hydrated}
          onSubmit={handleSubmit}
          isBusy={isBusy}
          placeholder={t('ask.placeholder')}
          emptyState={emptyState}
        />
      </div>
    </AppShell>
  )
}

/* ── helpers ────────────────────────────────────────────── */

function EmptyState({ onPick }: { onPick(p: string): void }) {
  const t = useT()
  return (
    <div className="relative z-0 mx-auto flex w-full max-w-md flex-col items-center gap-4 px-5 pb-2 text-center">
      <BrandMark size={48} className="mb-1" />
      <h2 className="font-serif text-[28px] italic leading-[1.1] tracking-tight text-ink">
        {t('ask.empty.title')}
      </h2>
      <p className="max-w-xs text-[14px] leading-relaxed text-muted">{t('ask.empty.body')}</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {SUGGESTED_PROMPT_KEYS.map((key) => {
          const prompt = t(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(prompt)}
              className="whitespace-nowrap rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[13px] text-ink-2 backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink"
            >
              {prompt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
