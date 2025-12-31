/**
 * Sidebar Inset Component
 *
 * Container for main content area next to sidebar.
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-full w-full flex-col bg-background overflow-hidden',
      className
    )}
    {...props}
  />
))
SidebarInset.displayName = 'SidebarInset'
