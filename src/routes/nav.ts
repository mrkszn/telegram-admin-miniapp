import {
  LayoutGrid,
  BarChart3,
  Tags,
  Users,
  MessageSquare,
  Gift,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'

export interface DrawerNavItem {
  to: string
  /** i18n key resolved at render time. */
  label: TranslationKey
  icon: LucideIcon
  /** Treat the path as the section root; matches `to` exactly. */
  end?: boolean
}

/**
 * Drawer navigation — the 7 sections surfaced behind the Claude-style left
 * sidebar. Order = chat first (the landing route), then analytics, then the
 * "extras" (prizes + settings) that previously hid behind a gear icon.
 */
export const DRAWER_NAV: DrawerNavItem[] = [
  { to: '/', label: 'nav.chat', icon: MessageSquare, end: true },
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutGrid, end: true },
  { to: '/metrics', label: 'nav.metrics', icon: BarChart3 },
  { to: '/topics', label: 'nav.topics', icon: Tags },
  { to: '/clients', label: 'nav.clients', icon: Users },
  { to: '/prizes', label: 'nav.prizes', icon: Gift },
  { to: '/settings', label: 'nav.settings', icon: Settings },
]
