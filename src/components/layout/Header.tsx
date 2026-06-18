import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface HeaderProps {
  title: ReactNode
  /** Left slot. If omitted and `onBack` is set, a fallback back-arrow renders. */
  left?: ReactNode
  /** Right slot. */
  right?: ReactNode
  /** Optional in-app fallback when Telegram BackButton bridge isn't active. */
  onBack?: () => void
  className?: string
}

export function Header({ title, left, right, onBack, className }: HeaderProps) {
  const t = useT()
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-header items-center justify-between gap-2 border-b border-line bg-bg/80 px-4 backdrop-blur-md pt-safe-top',
        className,
      )}
    >
      <div className="flex min-w-9 items-center">
        {left ??
          (onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={t('header.back')}
              className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-tag text-ink transition-colors hover:bg-surface-2"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : null)}
      </div>
      <h1 className="truncate font-serif text-base font-semibold leading-none text-ink">
        {title}
      </h1>
      <div className="flex min-w-9 items-center justify-end">{right}</div>
    </header>
  )
}
