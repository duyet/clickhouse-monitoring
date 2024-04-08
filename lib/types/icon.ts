import type { IconProps } from '@radix-ui/react-icons/dist/types'
import type { LucideProps } from 'lucide-react'

declare const RadixOrLucide:
  | React.ForwardRefExoticComponent<
      IconProps & React.RefAttributes<SVGSVGElement>
    >
  | React.ForwardRefExoticComponent<LucideProps>

export type Icon = typeof RadixOrLucide
