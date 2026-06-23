import { LayoutGrid, BarChart3, Tags, Users, MessageSquare } from 'lucide-react'
import type { NavItem } from '@/components/layout/BottomNav'

/** The 5-slot admin bottom navigation, shared across pages. */
export const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutGrid, end: true },
  { to: '/metrics', label: 'nav.metrics', icon: BarChart3 },
  { to: '/topics', label: 'nav.topics', icon: Tags },
  { to: '/clients', label: 'nav.clients', icon: Users },
  { to: '/ask', label: 'nav.ask', icon: MessageSquare },
]
