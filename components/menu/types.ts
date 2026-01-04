import type { BadgeVariant } from '@/types/badge-variant'
import type { Icon } from '@/types/icon'

export type MenuSection = 'main' | 'others'

export interface MenuItem {
  title: string
  href: string
  description?: string
  /** Key for fetching count from /api/v1/menu-counts/[key] */
  countKey?: string
  /** Label shown on hover (e.g., "running", "merges", "tables") */
  countLabel?: string
  countVariant?: BadgeVariant
  items?: MenuItem[]
  icon?: Icon
  /** Section grouping for sidebar display */
  section?: MenuSection
  /** Show "New" badge - hidden after user visits the page */
  isNew?: boolean
  /** Link to ClickHouse documentation for this feature */
  docs?: string
}
