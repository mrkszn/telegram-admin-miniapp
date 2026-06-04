import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Treat the path as the section root; matches `to` exactly. */
  end?: boolean
}

interface BottomNavProps {
  items: NavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'sticky bottom-0 z-30 flex h-nav items-stretch justify-around border-t border-line bg-bg/90 backdrop-blur-md pb-safe-bottom',
        className,
      )}
      aria-label="Основная навигация"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-brand' : 'text-muted hover:text-ink',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2 : 1.75}
                aria-hidden="true"
              />
              <span className="leading-none">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
