/**
 * Sidebar Footer Component
 *
 * Footer section container for sidebar content.
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 border-t px-4 py-3', className)}
    {...props}
  />
))
SidebarFooter.displayName = 'SidebarFooter'
