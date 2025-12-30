import type { BadgeVariant } from '@/types/badge-variant'
import type { Icon } from '@/types/icon'

export interface MenuItem {
  title: string
  href: string
  description?: string
  /** Key for fetching count from /api/v1/menu-counts/[key] */
  countKey?: string
  countVariant?: BadgeVariant
  items?: MenuItem[]
  icon?: Icon
}
