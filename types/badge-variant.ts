import type { VariantProps } from 'class-variance-authority'

import type { badgeVariants } from '@/components/ui'

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant']
