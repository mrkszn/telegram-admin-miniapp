import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ClientListSheet } from '@/components/clients/ClientListSheet'
import { fetchTopicClients } from '@/lib/api/admin'
import { useT } from '@/lib/i18n'
import type { DateRange } from '@/lib/api/admin'
import type { TopicCount } from '@/lib/api/types'

interface TopicListSheetProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  topics: TopicCount[]
  /** Forwarded to the topic→clients query so the cohort matches the period. */
  range?: DateRange
}

/**
 * Bottom-sheet list of topics; picking one drills into the clients who
 * mentioned it via the shared {@link ClientListSheet}.
 */
export function TopicListSheet({
  open,
  onOpenChange,
  title,
  topics,
  range,
}: TopicListSheetProps) {
  const t = useT()
  const [topic, setTopic] = useState<string | null>(null)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-sheet">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className="sr-only">{title}</SheetDescription>
          </SheetHeader>
          <div className="mt-3">
            {topics.length === 0 ? (
              <p className="py-3 text-sm text-muted">{t('common.noData')}</p>
            ) : (
              <ul className="flex list-none flex-col gap-2 p-0" data-testid="topic-list">
                {topics.map((tp) => (
                  <li key={tp.topic}>
                    <button
                      type="button"
                      onClick={() => setTopic(tp.topic)}
                      className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:border-line-strong"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {tp.topic}
                      </span>
                      <span className="shrink-0 font-mono text-[13px] font-medium text-muted">
                        {tp.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ClientListSheet
        open={topic != null}
        onOpenChange={(o) => {
          if (!o) setTopic(null)
        }}
        title={topic ?? ''}
        description={t('clients.byTopic')}
        fetchKey={topic ?? ''}
        fetcher={() => fetchTopicClients(topic ?? '', range)}
      />
    </>
  )
}
