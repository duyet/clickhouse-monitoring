/**
 * Sidebar module exports
 */

// Core
export { Sidebar } from './sidebar'
export { SidebarProvider } from './provider'
export { useSidebar } from './context'

// Types
export type {
  SidebarContextValue,
  SidebarGroupLabelProps,
  SidebarMenuActionProps,
  SidebarMenuButtonProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubButtonProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarState,
} from './types'

// Config
export {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_WIDTH,
} from './config'

// Layout Components
export { SidebarContent } from './components/sidebar-content'
export { SidebarFooter } from './components/sidebar-footer'
export { SidebarHeader } from './components/sidebar-header'
export { SidebarInset } from './components/sidebar-inset'
export { SidebarInput } from './components/sidebar-input'
export { SidebarRail } from './components/sidebar-rail'
export { SidebarSeparator } from './components/sidebar-separator'
export { SidebarTrigger } from './components/sidebar-trigger'

// Group Components
export {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
} from './components/sidebar-group'

// Menu Components
export {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './components/sidebar-menu'
