/**
 * Sidebar Input Component
 *
 * Styled input field for sidebar content.
 */

'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(
      'h-8 w-full bg-background px-2 text-xs shadow-none placeholder:text-sidebar-foreground/40',
      className
    )}
    {...props}
  />
))
SidebarInput.displayName = 'SidebarInput'
