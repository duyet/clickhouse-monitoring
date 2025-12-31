/**
 * Sidebar type definitions
 */

import type { TooltipContent } from '@/components/ui/tooltip'

export type SidebarState = 'expanded' | 'collapsed'

export interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
  size?: 'sm' | 'default' | 'lg'
}

export interface SidebarMenuSubButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  size?: 'sm' | 'default'
}

export interface SidebarMenuActionProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  showOnHover?: boolean
}

export interface SidebarGroupLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

export interface SidebarMenuSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean
}
