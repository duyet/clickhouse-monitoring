import type { CountBadgeProps } from '@/components/menu/count-badge'
import type { Icon } from '@/types/icon'

export interface MenuItem {
  title: string
  href: string
  description?: string
  countSql?: string
  countVariant?: CountBadgeProps['variant']
  items?: MenuItem[]
  icon?: Icon
}
