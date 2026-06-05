import type { ReactNode } from 'react'
import { Sparkles, User2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MessageRole = 'user' | 'agent' | 'thinking'

export interface MessageProps {
  role: MessageRole
  content: ReactNode
  /** Optional chart / attachment rendered below the bubble. */
  chart?: ReactNode
  className?: string
}

const bubbleClass: Record<MessageRole, string> = {
  user: 'bg-brand text-brand-on rounded-card rounded-br-tag',
  agent: 'bg-surface border border-line text-ink rounded-card rounded-bl-tag',
  thinking: 'bg-surface-2 text-muted rounded-card rounded-bl-tag italic',
}

const rowClass: Record<MessageRole, string> = {
  user: 'justify-end',
  agent: 'justify-start',
  thinking: 'justify-start',
}

export function Message({ role, content, chart, className }: MessageProps) {
  return (
    <div
      className={cn(
        'flex w-full animate-fade-rise gap-2',
        rowClass[role],
        className,
      )}
    >
      {role !== 'user' ? (
        <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </div>
      ) : null}
      <div className="flex max-w-[82%] flex-col gap-2">
        <div
          className={cn(
            // Body font size + leading kept identical between user and agent
            // bubbles so the chat reads as a balanced conversation, not
            // marketing-vs-system.
            'whitespace-pre-line px-3.5 py-2.5 text-[14px] leading-[1.45]',
            bubbleClass[role],
          )}
        >
          {role === 'thinking' ? <ThinkingDots /> : content}
        </div>
        {chart ? (
          <div className="animate-fade-rise overflow-hidden rounded-card border border-line bg-surface [animation-delay:120ms]">
            {chart}
          </div>
        ) : null}
      </div>
      {role === 'user' ? (
        <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
          <User2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:240ms]" />
    </span>
  )
}
