/**
 * Sidebar Rail Component
 *
 * Draggable rail handle for sidebar resize.
 */

'use client'

import * as React from 'react'
import { useSidebar } from '../context'
import { cn } from '@/lib/utils'

export const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute -right-2 top-1/2 z-[100] hidden -translate-y-1/2 h-12 w-3 rounded-l-md bg-primary/10 hover:bg-primary/20 transition-colors cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'md:flex',
        className
      )}
      {...props}
    >
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})
SidebarRail.displayName = 'SidebarRail'
