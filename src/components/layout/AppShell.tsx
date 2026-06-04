import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Header } from './Header'
import { BottomNav, type NavItem } from './BottomNav'

interface AppShellProps {
  title: ReactNode
  children: ReactNode
  /** Bottom nav items. Pass `[]` to hide the nav. */
  navItems: NavItem[]
  headerLeft?: ReactNode
  headerRight?: ReactNode
  onBack?: () => void
  className?: string
  contentClassName?: string
}

export function AppShell({
  title,
  children,
  navItems,
  headerLeft,
  headerRight,
  onBack,
  className,
  contentClassName,
}: AppShellProps) {
  const showNav = navItems.length > 0
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-bg text-ink',
        className,
      )}
    >
      <Header title={title} left={headerLeft} right={headerRight} onBack={onBack} />
      <main className={cn('flex-1 overflow-x-hidden px-4 py-4', contentClassName)}>{children}</main>
      {showNav ? <BottomNav items={navItems} /> : null}
    </div>
  )
}

export type { NavItem }
