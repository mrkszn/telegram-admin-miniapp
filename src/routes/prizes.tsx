import { Gift } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useT } from '@/lib/i18n'

/**
 * Prizes placeholder. The full feature lands in a follow-up — for now the
 * route just exists so the drawer entry is reachable instead of 404-ing.
 */
export function PrizesRoute() {
  const t = useT()
  return (
    <AppShell title={t('title.prizes')}>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-on-soft">
          <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 className="font-serif text-[22px] italic leading-tight text-ink">
          {t('prizes.empty.title')}
        </h2>
        <p className="text-[14px] leading-relaxed text-muted">{t('prizes.empty.body')}</p>
      </div>
    </AppShell>
  )
}
