import { type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useChatStore } from '@/lib/state/chat-store'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface AskAiMarkerProps {
  /** Pre-filled question routed to /ask. */
  question: string
  /** Optional override for the aria-label. Defaults to the generic "ask AI". */
  ariaLabel?: string
  className?: string
}

/**
 * Small icon button — taps queue a pre-built question with the chat store
 * and navigate to /ask, where AskRoute flushes the queue and fires it. The
 * marker is its own clickable zone with stopPropagation, so containing
 * cards / list rows keep their original drill-down behaviour.
 */
export function AskAiMarker({ question, ariaLabel, className }: AskAiMarkerProps) {
  const t = useT()
  const navigate = useNavigate()
  const enqueueQuestion = useChatStore((s) => s.enqueueQuestion)

  function onClick(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    e.preventDefault()
    enqueueQuestion(question)
    navigate('/ask')
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? t('askAi.aria')}
      title={ariaLabel ?? t('askAi.aria')}
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-brand-text transition-colors hover:border-line-strong hover:bg-brand-soft hover:text-brand-on-soft',
        className,
      )}
    >
      <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
