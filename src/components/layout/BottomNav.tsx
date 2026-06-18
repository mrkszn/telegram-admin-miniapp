import { useEffect, type ComponentType, type SVGProps } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/state/chat-store'
import { rememberLastTab } from '@/lib/state/view-prefs'
import { useT, type TranslationKey } from '@/lib/i18n'

export interface NavItem {
  to: string
  /** i18n key resolved at render time. */
  label: TranslationKey
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Treat the path as the section root; matches `to` exactly. */
  end?: boolean
}

interface BottomNavProps {
  items: NavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  const t = useT()
  const chatBusy = useChatStore((s) => s.isBusy)
  const { pathname } = useLocation()

  // Remember the active tab so a restart / root redirect returns here.
  useEffect(() => {
    rememberLastTab(pathname)
  }, [pathname])

  return (
    <nav
      className={cn(
        'sticky bottom-0 z-30 flex h-nav items-stretch justify-around border-t border-line bg-bg/90 backdrop-blur-md pb-safe-bottom',
        className,
      )}
      aria-label={t('nav.aria')}
    >
      {items.map((item) => {
        // Currently only the chat path is "background-busy" aware: when the
        // user fired off a question and navigated away, we surface a small
        // pulsing brand dot on top of the chat tab so they remember it's
        // still cooking.
        const showBusyDot = chatBusy && item.to === '/ask'
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-text' : 'text-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    className="h-5 w-5"
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
                </div>
                <span className="leading-none">{t(item.label)}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
