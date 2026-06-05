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
        'flex w-full animate-fade-rise flex-col gap-2',
        // Use rowClass on a sibling row, not the wrapper, so the chart
        // attachment below can ignore the bubble's max-width and use the
        // full available width of the chat container.
        className,
      )}
    >
      <div className={cn('flex w-full gap-2', rowClass[role])}>
        {role !== 'user' ? (
          <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
        ) : null}
        <div
          className={cn(
            'max-w-[82%] whitespace-pre-line px-3.5 py-2.5 text-[14px] leading-[1.45]',
            bubbleClass[role],
          )}
        >
          {role === 'thinking' ? <ThinkingDots /> : content}
        </div>
        {role === 'user' ? (
          <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
            <User2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {chart ? (
        // Chart sits OUTSIDE the bubble row → it gets the full chat
        // column width (minus the 7 px avatar gutter on the agent side),
        // so vertical-layout BarCharts have real room for category labels.
        <div
          className={cn(
            'animate-fade-rise overflow-hidden rounded-card border border-line bg-surface [animation-delay:120ms]',
            role === 'agent' || role === 'thinking' ? 'ml-9' : 'mr-9',
          )}
        >
          {chart}
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
