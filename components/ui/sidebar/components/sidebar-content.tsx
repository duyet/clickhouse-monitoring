/**
 * Sidebar Content Component
 *
 * Scrollable content area for sidebar.
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]/sidebar:overflow-hidden',
      className
    )}
    {...props}
  />
))
SidebarContent.displayName = 'SidebarContent'
