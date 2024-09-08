import type { BadgeProps } from '@/components/ui/badge'
import type { Icon } from '@/types/icon'

export interface MenuItem {
  title: string
  href: string
  description?: string
  countSql?: string
  countVariant?: BadgeProps['variant']
  items?: MenuItem[]
  icon?: Icon
}
