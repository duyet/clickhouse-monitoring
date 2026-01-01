/**
 * Menu icon component
 *
 * Handles icon rendering with active state styling.
 */

'use client'

import type { Icon } from '@/types/icon'

import { cn } from '@/lib/utils'

interface MenuIconProps {
  icon?: Icon
  isActive?: boolean
}

/**
 * Icon component with active state styling
 *
 * Accepts both Radix and Lucide icons.
 * Lucide icons support strokeWidth prop while Radix icons ignore it.
 */
export function MenuIcon({ icon: Icon, isActive }: MenuIconProps) {
  if (!Icon) return null

  return (
    <Icon
      className={cn(
        'size-3.5 transition-colors',
        !isActive && 'opacity-60',
        isActive && 'opacity-100 text-primary'
      )}
      // Lucide icons accept strokeWidth, Radix icons ignore unknown props
      {...({ strokeWidth: 1.5 } as Record<string, unknown>)}
      aria-hidden="true"
    />
  )
}
