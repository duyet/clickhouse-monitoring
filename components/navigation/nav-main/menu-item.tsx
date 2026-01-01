'use client'

import { ChevronRight } from 'lucide-react'

import type { MenuItem as MenuItemType } from '@/components/menu/types'
import type { MenuItemActiveState, MenuItemProps } from './types'

import { CollapsedSubmenu } from './collapsed-submenu'
import { memo } from 'react'
import { HostPrefixedLink } from '@/components/menu/link-with-context'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'

/**
 * Determines the active state for a menu item
 */
function getMenuItemActiveState(
  item: MenuItemType,
  pathname: string
): MenuItemActiveState {
  const isActive = isMenuItemActive(item.href, pathname)
  const hasChildren = item.items && item.items.length > 0

  const hasActiveChild =
    hasChildren && item.items
      ? item.items.some(
          (child) => child.href && isMenuItemActive(child.href, pathname)
        )
      : false

  return { isActive, hasActiveChild }
}

/**
 * Renders a single menu item without children
 */
const SingleMenuItem = memo(function SingleMenuItem({
  item,
  isActive,
}: {
  item: MenuItemType
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <HostPrefixedLink href={item.href}>
          {item.icon && <item.icon className="h-4 w-4" />}
          <span className="group-data-[state=collapsed]/sidebar:hidden">
            {item.title}
          </span>
        </HostPrefixedLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

/**
 * Renders a menu item with children (collapsible)
 */
const CollapsibleMenuItem = memo(function CollapsibleMenuItem({
  item,
  pathname,
  hasActiveChild,
}: {
  item: MenuItemType
  pathname: string
  hasActiveChild: boolean
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  // The icon button (trigger) - rendered differently based on state
  const triggerButton = (
    <SidebarMenuButton isActive={hasActiveChild}>
      {item.icon && <item.icon className="h-4 w-4" />}
      <span className="group-data-[state=collapsed]/sidebar:hidden">
        {item.title}
      </span>
      <ChevronRight className="ml-auto transition-all duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=collapsed]/sidebar:hidden" />
    </SidebarMenuButton>
  )

  // When collapsed, use Popover submenu
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <CollapsedSubmenu
          item={item}
          pathname={pathname}
          trigger={triggerButton}
        />
      </SidebarMenuItem>
    )
  }

  // When expanded, use regular Collapsible
  return (
    <Collapsible
      asChild
      defaultOpen={hasActiveChild}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>{triggerButton}</CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isMenuItemActive(subItem.href, pathname)}
                >
                  <HostPrefixedLink href={subItem.href}>
                    <span className="group-data-[state=collapsed]/sidebar:hidden">
                      {subItem.title}
                    </span>
                  </HostPrefixedLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
})

/**
 * MenuItem component - renders a single menu item or collapsible menu with children
 */
export const MenuItem = memo(function MenuItem({
  item,
  pathname,
}: MenuItemProps) {
  const hasChildren = item.items && item.items.length > 0
  const { isActive, hasActiveChild } = getMenuItemActiveState(item, pathname)

  if (!hasChildren) {
    return <SingleMenuItem item={item} isActive={isActive} />
  }

  return (
    <CollapsibleMenuItem
      item={item}
      pathname={pathname}
      hasActiveChild={hasActiveChild}
    />
  )
})
