import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { useChatStore } from '@/lib/state/chat-store'
import { useDrawerStore } from '@/lib/state/drawer-store'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { BrandMark } from '@/components/brand/BrandMark'
import { ThemeChip } from '@/components/controls/ThemeChip'
import { LanguageChip } from '@/components/controls/LanguageChip'
import { DRAWER_NAV } from '@/routes/nav'
import { APP_VERSION } from '@/lib/app-version'

/**
 * Claude-style left drawer. Mounted ONCE at the App root and controlled via
 * `useDrawerStore` so any hamburger / future affordance can pop it open
 * without remounting per route. Built on top of `ui/sheet.tsx` (Radix
 * Dialog wrapper) with `side='left'` + `flush` so the brand header /
 * nav / footer scaffold renders without the default p-4 wrapper.
 *
 * Close-on-navigate is wired into each NavLink's onClick (instead of an
 * effect on pathname) — that way tapping the active route also closes
 * the drawer and there's no eslint-disable / stale-closure smell.
 */
export function AppDrawer() {
  const t = useT()
  const open = useDrawerStore((s) => s.open)
  const setOpen = useDrawerStore((s) => s.setOpen)
  const chatBusy = useChatStore((s) => s.isBusy)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        flush
        aria-label={t('drawer.aria')}
        className={cn(
          'flex w-[82%] max-w-[300px] flex-col bg-surface text-ink pt-safe-top pb-safe-bottom',
        )}
      >
        <SheetTitle className="sr-only">{t('drawer.title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('drawer.description')}</SheetDescription>

        <DrawerHeader />
        <DrawerNav chatBusy={chatBusy} onNavigate={() => setOpen(false)} />
        <DrawerFooter />
      </SheetContent>
    </Sheet>
  )
}

function DrawerHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-line px-4 py-4">
      <BrandMark size={36} />
      <div className="flex min-w-0 flex-col leading-none">
        <span className="font-serif text-[20px] italic leading-none text-ink">InsightFlow</span>
        <span className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-2">
          admin
        </span>
      </div>
    </header>
  )
}

function DrawerNav({
  chatBusy,
  onNavigate,
}: {
  chatBusy: boolean
  onNavigate(): void
}) {
  const t = useT()
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label={t('nav.aria')}>
      <ul className="flex flex-col gap-1">
        {DRAWER_NAV.map((item) => {
          const showBusyDot = chatBusy && item.to === '/'
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-input px-3 py-2.5 text-[14px] font-medium transition-colors',
                    isActive
                      ? 'bg-brand-soft text-brand-on-soft'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative inline-flex">
                      <item.icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={isActive ? 2 : 1.75}
                        aria-hidden="true"
                      />
                      {showBusyDot ? (
                        <span
                          aria-label={t('nav.agentBusy')}
                          className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2"
                        >
                          <span className="animate-brand-pulse absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate">{t(item.label)}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function DrawerFooter() {
  return (
    <footer className="border-t border-line px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <ThemeChip />
        <LanguageChip />
      </div>
      <p className="mt-3 px-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-2">
        v{APP_VERSION}
      </p>
    </footer>
  )
}
