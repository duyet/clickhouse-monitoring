'use client'

import type { LucideIcon } from 'lucide-react'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export interface NavSecondaryItem {
  title: string
  url: string
  icon: LucideIcon
  external?: boolean
}

export interface NavSecondaryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items: NavSecondaryItem[]
}

export function NavSecondary({
  items,
  className,
  ...props
}: NavSecondaryProps) {
  return (
    <SidebarGroup className={className} {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <Link
                  href={item.url}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.external && (
                    <ExternalLinkIcon className="ml-auto h-3 w-3" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
