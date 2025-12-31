'use client'

import { Github, Info, Settings } from 'lucide-react'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { HostSwitcher } from '@/components/host/host-switcher'
import { NavMain } from '@/components/navigation/nav-main'
import { NavSecondary } from '@/components/navigation/nav-secondary'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuSkeleton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { menuItemsConfig } from '@/menu'

const GITHUB_REPO = 'https://github.com/duyet/clickhouse-monitoring'

interface AppSidebarProps {
  hosts: Array<Omit<HostInfo, 'user'>>
  currentHostId: number
}

export function AppSidebar({ hosts, currentHostId }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        {hosts.length > 0 ? (
          <HostSwitcher hosts={hosts} currentHostId={currentHostId} />
        ) : (
          <SidebarMenuSkeleton />
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={menuItemsConfig} />
      </SidebarContent>

      <SidebarFooter>
        <NavSecondary
          items={[
            {
              title: 'Settings',
              url: '/settings',
              icon: Settings,
            },
            {
              title: 'About',
              url: '/about',
              icon: Info,
            },
            {
              title: 'GitHub',
              url: GITHUB_REPO,
              icon: Github,
              external: true,
            },
          ]}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
