/**
 * Sidebar Separator Component
 *
 * Styled separator for sidebar sections.
 */

'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn('mx-2 bg-sidebar-border', className)}
    {...props}
  />
))
SidebarSeparator.displayName = 'SidebarSeparator'
