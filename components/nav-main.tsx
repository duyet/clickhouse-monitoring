'use client'

import { ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { HostPrefixedLink } from '@/components/menu/link-with-context'
import { isMenuItemActive } from '@/lib/menu/breadcrumb'
import type { MenuItem } from '@/components/menu/types'

interface NavMainProps {
  items: MenuItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0
          const isActive = isMenuItemActive(item.href, pathname)
          const hasActiveChild = hasChildren && item.items
            ? item.items.some(
                (child) => child.href && isMenuItemActive(child.href, pathname)
              )
            : false

          if (!hasChildren) {
            // Single item without children
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
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
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
