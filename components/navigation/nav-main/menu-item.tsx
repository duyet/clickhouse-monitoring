'use client'

import { ChevronRight } from 'lucide-react'

import type { MenuItem as MenuItemType } from '@/components/menu/types'
import type { MenuItemActiveState, MenuItemProps } from './types'

import { CollapsedSubmenu } from './collapsed-submenu'
import dynamic from 'next/dynamic'
import { memo } from 'react'
import { HostPrefixedLink } from '@/components/menu/link-with-context'

const NewBadge = dynamic(() =>
  import('@/components/menu/components/new-badge').then((mod) => mod.NewBadge)
)

const CountBadge = dynamic(() =>
  import('@/components/menu/components/count-badge').then(
    (mod) => mod.CountBadge
  )
)

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
        <HostPrefixedLink href={item.href} className="flex w-full items-center">
          {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
          <span className="group-data-[state=collapsed]/sidebar:hidden">
            {item.title}
          </span>
          <span className="ml-auto flex items-center gap-1.5 group-data-[state=collapsed]/sidebar:hidden">
            <NewBadge href={item.href} isNew={item.isNew} />
            {item.countKey && (
              <CountBadge
                countKey={item.countKey}
                countLabel={item.countLabel}
                countVariant={item.countVariant}
              />
            )}
          </span>
        </HostPrefixedLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

/**
 * Renders a menu item with children (collapsible)
 * Uses standard shadcn/ui pattern - entire button triggers toggle
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

  // When collapsed, use Popover submenu
  if (isCollapsed) {
    const triggerButton = (
      <SidebarMenuButton isActive={hasActiveChild}>
        {item.icon && <item.icon className="h-4 w-4" />}
        <span className="group-data-[state=collapsed]/sidebar:hidden">
          {item.title}
        </span>
        {item.countKey && (
          <span className="ml-auto group-data-[state=collapsed]/sidebar:hidden">
            <CountBadge
              countKey={item.countKey}
              countLabel={item.countLabel}
              countVariant={item.countVariant}
            />
          </span>
        )}
        <ChevronRight className="ml-auto transition-all duration-200 group-data-[state=collapsed]/sidebar:hidden" />
      </SidebarMenuButton>
    )

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

  // Standard shadcn/ui pattern: Collapsible wraps SidebarMenuItem
  // Entire button (text + chevron) triggers toggle
  return (
    <Collapsible
      asChild
      defaultOpen={hasActiveChild}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={hasActiveChild} tooltip={item.title}>
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.title}</span>
            {item.countKey && (
              <span className="ml-auto">
                <CountBadge
                  countKey={item.countKey}
                  countLabel={item.countLabel}
                  countVariant={item.countVariant}
                />
              </span>
            )}
            <ChevronRight className="ml-auto transition-all duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isMenuItemActive(subItem.href, pathname)}
                >
                  <HostPrefixedLink
                    href={subItem.href}
                    className="flex w-full items-center gap-2"
                  >
                    <span className="group-data-[state=collapsed]/sidebar:hidden min-w-0 truncate">
                      {subItem.title}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5">
                      <NewBadge href={subItem.href} isNew={subItem.isNew} />
                      {subItem.countKey && (
                        <CountBadge
                          countKey={subItem.countKey}
                          countLabel={subItem.countLabel}
                          countVariant={subItem.countVariant}
                        />
                      )}
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
