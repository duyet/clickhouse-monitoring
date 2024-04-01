import type { CountBadgeProps } from '@/components/menu/count-badge'
import type { IconProps } from '@radix-ui/react-icons/dist/types'
import type { LucideProps } from 'lucide-react'

declare const RadixIcon:
  | React.ForwardRefExoticComponent<
      IconProps & React.RefAttributes<SVGSVGElement>
    >
  | React.ForwardRefExoticComponent<LucideProps>

export interface MenuItem {
  title: string
  href: string
  description?: string
  countSql?: string
  countVariant?: CountBadgeProps['variant']
  items?: MenuItem[]
  icon?: typeof RadixIcon
}
