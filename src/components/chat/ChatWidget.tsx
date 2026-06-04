import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { SendHorizonal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Message, type MessageProps } from './Message'

export interface ChatMessage extends MessageProps {
  id: string
}

interface ChatWidgetProps {
  messages: ChatMessage[]
  onSubmit(text: string): void
  placeholder?: string
  /** When true, disable input + show thinking row. */
  isBusy?: boolean
  className?: string
  emptyState?: ReactNode
}

export interface ChatWidgetHandle {
  scrollToBottom(): void
  focus(): void
}

export const ChatWidget = forwardRef<ChatWidgetHandle, ChatWidgetProps>(function ChatWidget(
  { messages, onSubmit, placeholder = 'Сообщение…', isBusy = false, className, emptyState },
  ref,
) {
  const [value, setValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    },
    focus: () => inputRef.current?.focus(),
  }))

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isBusy) return
    onSubmit(trimmed)
    setValue('')
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-3">
        {messages.length === 0 && emptyState ? (
          <div className="flex h-full items-center justify-center py-8">{emptyState}</div>
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id}>
                <Message role={m.role} content={m.content} chart={m.chart} />
              </li>
            ))}
            {isBusy ? (
              <li>
                <Message role="thinking" content="" />
              </li>
            ) : null}
          </ol>
        )}
      </div>
      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-line bg-bg/90 px-2 py-2 backdrop-blur-md"
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={placeholder}
          disabled={isBusy}
          aria-label="Сообщение"
          className="max-h-32 flex-1 resize-none rounded-input border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Отправить"
          disabled={isBusy || value.trim().length === 0}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-brand text-brand-on transition-colors hover:bg-brand-hover disabled:opacity-40"
        >
          <SendHorizonal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
})
