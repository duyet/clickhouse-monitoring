/**
 * Sidebar Trigger Component
 *
 * Button to toggle sidebar open/closed state.
 */

'use client'

import * as React from 'react'
import { ChevronLeft, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '../context'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import { cn } from '@/lib/utils'

export const SidebarTrigger = React.forwardRef<
  ElementRef<typeof Button>,
  ComponentPropsWithoutRef<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn('h-9 w-9', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {state === 'collapsed' ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = 'SidebarTrigger'
