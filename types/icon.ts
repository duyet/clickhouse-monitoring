import type { LucideProps } from 'lucide-react'

import type { IconProps } from '@radix-ui/react-icons/dist/types'

declare const RadixOrLucide:
  | React.ForwardRefExoticComponent<
      IconProps & React.RefAttributes<SVGSVGElement>
    >
  | React.ForwardRefExoticComponent<LucideProps>

export type Icon = typeof RadixOrLucide
