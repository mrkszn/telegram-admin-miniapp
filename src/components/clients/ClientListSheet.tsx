import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { BrandSpinner } from '@/components/feedback/BrandSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ClientList } from '@/components/clients/ClientList'
import { ClientProfileSheet } from '@/components/clients/ClientProfileSheet'
import { toApiError } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import type { ApiError, ClientRef, ClientsResponse } from '@/lib/api/types'

interface ClientListSheetProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  description?: string
  /**
   * Fetches the clients to show. Re-runs whenever `fetchKey` changes while
   * the sheet is open, so the same sheet instance serves every drill-down.
   */
  fetcher: () => Promise<ClientsResponse>
  fetchKey: string
}

/**
 * Bottom-sheet list of clients for any aggregate drill-down (topic,
 * category, …). Tapping a client opens the shared {@link ClientProfileSheet}
 * stacked on top.
 */
export function ClientListSheet({
  open,
  onOpenChange,
  title,
  description,
  fetcher,
  fetchKey,
}: ClientListSheetProps) {
  const t = useT()
  const [clients, setClients] = useState<ClientRef[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [profileId, setProfileId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setClients(null)
    setError(null)
    fetcher()
      .then((res) => {
        if (!cancelled) setClients(res.clients)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toApiError(err))
      })
    return () => {
      cancelled = true
    }
    // `fetcher` identity is owned by the caller and changes with `fetchKey`;
    // we key off the latter (plus reloadTick) to avoid extra reruns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fetchKey, reloadTick])

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-sheet">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className={description ? undefined : 'sr-only'}>
              {description ?? title}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-3">
            {error ? (
              <ErrorState onRetry={() => setReloadTick((n) => n + 1)} />
            ) : clients == null ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted">
                <BrandSpinner size="sm" />
                <span>{t('clients.searching')}</span>
              </div>
            ) : clients.length === 0 ? (
              <p className="py-3 text-sm text-muted">{t('clients.nothingFound')}</p>
            ) : (
              <ClientList clients={clients} onPick={(id) => setProfileId(id)} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ClientProfileSheet
        telegramId={profileId}
        onOpenChange={(o) => {
          if (!o) setProfileId(null)
        }}
      />
    </>
  )
}
