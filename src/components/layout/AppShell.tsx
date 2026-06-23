import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { useChatStore } from '@/lib/state/chat-store'
import { useDrawerStore } from '@/lib/state/drawer-store'
import { rememberLastTab } from '@/lib/state/view-prefs'
import { Header } from './Header'

interface AppShellProps {
  title: ReactNode
  children: ReactNode
  /**
   * Left header slot. Defaults to the hamburger that opens the drawer; pass
   * a custom node (e.g. a Back arrow) on deep routes that should suppress
   * the drawer affordance.
   */
  headerLeft?: ReactNode
  /**
   * Right header slot. Pass `null` to hide. Routes with their own CTA
   * (e.g. "New chat" on the landing) supply their own node.
   */
  headerRight?: ReactNode
  onBack?: () => void
  className?: string
  contentClassName?: string
}

/**
 * Root chrome for every authenticated screen. Sticky header + the
 * Claude-style left drawer trigger + a scrollable content area. The drawer
 * itself is mounted ONCE at App.tsx via the global `useDrawerStore`, so
 * navigations don't tear it down. Per-route AppShell only renders the
 * hamburger (or back arrow) that flips the global open flag.
 *
 * Layout: `min-h-screen flex-col` with `<main>` carrying `flex-1 min-h-0`
 * so children using `h-full` actually fill the viewport without overflowing
 * past the safe-area inset on devices with a notch.
 */
export function AppShell({
  title,
  children,
  headerLeft,
  headerRight,
  onBack,
  className,
  contentClassName,
}: AppShellProps) {
  const t = useT()
  const { pathname } = useLocation()
  const setDrawerOpen = useDrawerStore((s) => s.setOpen)
  const chatBusy = useChatStore((s) => s.isBusy)

  // Record the visited section for the warm-restart landing logic. Chat
  // (`/`) is filtered out inside rememberLastTab — only known analytics
  // tabs become resume targets.
  useEffect(() => {
    rememberLastTab(pathname)
  }, [pathname])

  // Show a pulse-dot on the hamburger when the chat agent is still cooking
  // and the user has navigated away. On `/` we don't need it — the user is
  // already looking at the conversation.
  const showBusyDot = chatBusy && pathname !== '/'

  const left =
    headerLeft ??
    (onBack ? undefined : (
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={t('drawer.open')}
        title={t('drawer.open')}
        className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-tag text-ink transition-colors hover:bg-surface-2"
      >
        <span className="relative inline-flex">
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
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
      </button>
    ))

  return (
    <div className={cn('flex min-h-screen flex-col bg-bg text-ink', className)}>
      <Header title={title} left={left} right={headerRight} onBack={onBack} />
      <main className={cn('flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 py-4', contentClassName)}>
        {children}
      </main>
    </div>
  )
}
