/**
 * Sidebar Menu Components
 *
 * Navigation menu components for sidebar.
 */

'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSidebar } from '../context'
import { cn } from '@/lib/utils'
import type {
  SidebarMenuActionProps,
  SidebarMenuButtonProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubButtonProps,
} from '../types'

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
))
SidebarMenu.displayName = 'SidebarMenu'

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('group/menu-item relative', className)}
    {...props}
  />
))
SidebarMenuItem.displayName = 'SidebarMenuItem'

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      asChild = false,
      isActive = false,
      tooltip,
      size = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const { state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        className={cn(
          'peer/menu-button relative flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]/sidebar:h-10 group-data-[collapsible=icon]/sidebar:w-10 group-data-[collapsible=icon]/sidebar:p-0 aria-disabled:pointer-events-none aria-disabled:opacity-50',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          '[&>svg]:h-4 [&>svg]:w-4',
          isActive &&
            'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
          size === 'sm' && 'text-xs py-1',
          size === 'default' && 'text-sm',
          size === 'lg' &&
            'h-12 text-sm group-data-[collapsible=icon]/sidebar:!p-0',
          className
        )}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (state !== 'collapsed') {
      return button
    }

    const tooltipProps =
      typeof tooltip === 'string' ? { children: tooltip } : tooltip

    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" {...tooltipProps} />
        </Tooltip>
      </TooltipProvider>
    )
  }
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuActionProps
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      ref={ref}
      className={cn(
        'absolute right-1.5 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground/60 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-foreground [&>svg]:size-4',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[pressed=true]/menu-button:opacity-100 opacity-0',
        'group-data-[collapsible=icon]/sidebar:right-1.5',
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = 'SidebarMenuAction'

export const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute right-1 top-1.5 flex items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground pointer-events-none',
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = 'SidebarMenuBadge'

export const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  SidebarMenuSkeletonProps
>(({ className, showIcon = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-8 w-full items-center gap-2 rounded-md px-2', className)}
    {...props}
  >
    {showIcon && <Skeleton className="h-8 w-4 rounded-md" />}
    <Skeleton className="h-8 w-full" />
  </div>
))
SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton'

export const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      'border-l border-sidebar-border px-2 py-0.5 ml-3.5 flex flex-col gap-1',
      'group-data-[collapsible=icon]/sidebar:hidden',
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = 'SidebarMenuSub'

export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={className} {...props} />
))
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem'

export const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuSubButtonProps
>(
  (
    {
      asChild = false,
      isActive = false,
      size = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(
          'relative flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          '[&>svg]:h-4 [&>svg]:w-4',
          isActive &&
            'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
          size === 'sm' && 'text-xs py-1',
          size === 'default' && 'text-sm',
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton'

// Import Skeleton for SidebarMenuSkeleton
import { Skeleton } from '@/components/ui/skeleton'
