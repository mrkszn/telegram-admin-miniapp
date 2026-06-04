import { LayoutGrid, BarChart3, Tags, Users, MessageSquare } from 'lucide-react'
import type { NavItem } from '@/components/layout/BottomNav'

/** The 5-slot admin bottom navigation, shared across pages. */
export const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Главная', icon: LayoutGrid, end: true },
  { to: '/metrics', label: 'Метрики', icon: BarChart3 },
  { to: '/topics', label: 'Топики', icon: Tags },
  { to: '/clients', label: 'Клиенты', icon: Users },
  { to: '/ask', label: 'Чат', icon: MessageSquare },
]
