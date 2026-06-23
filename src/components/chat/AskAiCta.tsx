import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useChatStore } from '@/lib/state/chat-store'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface AskAiCtaProps {
  /** Pre-built question — should embed the selection (period, list, etc.). */
  question: string
  /** Override the button label. Default = "Запитати ШІ про вибірку". */
  label?: string
  className?: string
}

/**
 * Wide call-to-action for "send the current view to the AI agent". Lives in
 * one place per screen (above the data, next to the period picker) so the
 * intent reads as "analyse THIS selection" — distinct from the per-item
 * <AskAiMarker/> which is for analysing one specific row.
 */
export function AskAiCta({ question, label, className }: AskAiCtaProps) {
  const t = useT()
  const navigate = useNavigate()
  const enqueueQuestion = useChatStore((s) => s.enqueueQuestion)

  function onClick() {
    enqueueQuestion(question)
    navigate('/ask')
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-card border border-brand bg-brand-soft px-3 py-2 text-sm font-medium text-brand-on-soft transition-colors hover:bg-brand hover:text-brand-on',
        className,
      )}
    >
      <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {label ?? t('askAi.cta')}
    </button>
  )
}
