'use client'

import {
  Settings,
  Info,
  Github,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { menuItemsConfig } from '@/menu'

const GITHUB_REPO = 'https://github.com/duyet/clickhouse-monitoring'

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader />

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
