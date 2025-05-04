import type { BadgeVariant } from '@/types/badge-variant'
import type { Icon } from '@/types/icon'

export interface MenuItem {
  title: string
  href: string
  description?: string
  countSql?: string
  countVariant?: BadgeVariant
  items?: MenuItem[]
  icon?: Icon
}
