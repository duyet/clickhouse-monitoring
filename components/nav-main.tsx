'use client'

import { ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { HostPrefixedLink } from '@/components/menu/link-with-context'
import type { MenuItem, MenuSection } from '@/components/menu/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'

interface NavMainProps {
  items: MenuItem[]
}

const SECTION_LABELS: Record<MenuSection, string> = {
  main: 'ClickHouse',
  more: 'More',
}

function renderMenuItems(items: MenuItem[], pathname: string) {
  return items.map((item) => {
    const hasChildren = item.items && item.items.length > 0
    const isActive = isMenuItemActive(item.href, pathname)
    const hasActiveChild =
      hasChildren && item.items
        ? item.items.some(
            (child) => child.href && isMenuItemActive(child.href, pathname)
          )
        : false

    if (!hasChildren) {
      // Single item without children
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
            <HostPrefixedLink href={item.href}>
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.title}</span>
            </HostPrefixedLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    // Item with children - use collapsible
    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={hasActiveChild}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={hasActiveChild}>
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleTrigger asChild>
            <SidebarMenuAction className="data-[state=open]:rotate-90">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </SidebarMenuAction>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isMenuItemActive(subItem.href, pathname)}
                  >
                    <HostPrefixedLink href={subItem.href}>
                      <span>{subItem.title}</span>
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
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()
  const sections: MenuSection[] = ['main', 'more']

  return (
    <>
      {sections.map((section) => {
        const sectionItems = items.filter((item) => item.section === section)
        if (sectionItems.length === 0) return null

        return (
          <SidebarGroup key={section}>
            <SidebarGroupLabel>{SECTION_LABELS[section]}</SidebarGroupLabel>
            <SidebarMenu>{renderMenuItems(sectionItems, pathname)}</SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}
