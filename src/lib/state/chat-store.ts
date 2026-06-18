import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { askAdmin } from '@/lib/api/admin'
import { bootstrapAuth } from '@/lib/telegram/auth'
import { toApiError } from '@/lib/api/client'
import { getLanguage, translate } from '@/lib/i18n'
import type { AskHistoryItem, AskResponse } from '@/lib/api/types'

/**
 * Stored chat message. Lives in localStorage so closing/re-opening the
 * Mini App preserves history. `chartText` is kept as the raw ASCII the
 * agent emitted — we re-render it through <ChartFromText/> at display
 * time rather than persisting a React tree.
 */
export interface StoredChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  chartText?: string | null
}

export interface ChatState {
  messages: StoredChatMessage[]
  /** True while a /admin/ask round-trip is in flight. */
  isBusy: boolean
  /** Last failure message, if any. */
  error: string | null
  /** Question staged by an "ask AI" marker, waiting for /ask to mount. */
  queued: string | null

  send(question: string): Promise<void>
  clearError(): void
  clearChat(): void
  /**
   * Queue a question to be sent the next time the chat route mounts (used by
   * "ask AI" markers scattered across other tabs — they navigate to /ask and
   * let the route flush this queue, so the user lands on a chat that already
   * has their question + answer in flight). Replaces any older pending one.
   */
  enqueueQuestion(question: string): void
  /** Pop the queued question, if any. */
  consumeQueued(): string | null
}

const HISTORY_WINDOW = 6
const STORAGE_KEY = 'chat-store'

function nextId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `m-${Math.random().toString(36).slice(2, 10)}`
}

function buildHistory(messages: StoredChatMessage[]): AskHistoryItem[] {
  return messages
    .map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }))
    .slice(-HISTORY_WINDOW)
}

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

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isBusy: false,
      error: null,
      queued: null,

      async send(question: string) {
        const trimmed = question.trim()
        if (!trimmed || get().isBusy) return

        const userMsg: StoredChatMessage = {
          id: nextId(),
          role: 'user',
          content: trimmed,
        }
        // Push the user's question + flip the busy flag synchronously so
        // any route reading the store sees the same state. The agent
        // response will land here even if the user navigated away — that's
        // the whole point of moving this off route-local state.
        set({
          messages: [...get().messages, userMsg],
          isBusy: true,
          error: null,
        })

        const history = buildHistory(get().messages)

        try {
          const res = await submitAskWithRetry(trimmed, history)
          const agentMsg: StoredChatMessage = {
            id: nextId(),
            role: 'agent',
            content: res.answer_text,
            chartText: res.chart_text ?? null,
          }
          set({
            messages: [...get().messages, agentMsg],
            isBusy: false,
          })
        } catch (err) {
          const apiErr = toApiError(err)
          set({
            error: apiErr.message || translate(getLanguage(), 'ask.failed'),
            isBusy: false,
          })
        }
      },

      clearError() {
        set({ error: null })
      },

      clearChat() {
        set({ messages: [], error: null, isBusy: false })
      },

      enqueueQuestion(question: string) {
        const trimmed = question.trim()
        if (!trimmed) return
        set({ queued: trimmed })
      },

      consumeQueued() {
        const q = get().queued
        if (!q) return null
        set({ queued: null })
        return q
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Don't persist transient state. `isBusy` after a hard reload is
      // ALWAYS false — any in-flight axios call dies with the page, so
      // resurrecting busy=true would dead-lock the input box.
      partialize: (state) => ({
        messages: state.messages,
        error: state.error,
      }),
      // Same reason — force a clean isBusy when localStorage rehydrates.
      onRehydrateStorage: () => (state) => {
        if (state) state.isBusy = false
      },
    },
  ),
)
