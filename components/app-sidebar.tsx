'use client'

import { Github, Info, Settings } from 'lucide-react'
import { Suspense, use } from 'react'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { type HostConfig, HostSwitcher } from '@/components/host-switcher'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
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
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
  currentHostId: number
  fetchHostStatus: (hostId: number) => Promise<{
    uptime: string
    hostName: string
    version: string
  } | null>
}

function HostSwitcherWrapper({
  hostsPromise,
  currentHostId,
  fetchHostStatus,
}: AppSidebarProps) {
  const hosts = use(hostsPromise)

  const configs: HostConfig[] = hosts.map((host) => ({
    ...host,
    promise: fetchHostStatus(host.id),
  }))

  return <HostSwitcher hosts={configs} currentHostId={currentHostId} />
}

export function AppSidebar({
  hostsPromise,
  currentHostId,
  fetchHostStatus,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
          <HostSwitcherWrapper
            hostsPromise={hostsPromise}
            currentHostId={currentHostId}
            fetchHostStatus={fetchHostStatus}
          />
        </Suspense>
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
      <SidebarRail />
    </Sidebar>
  )
}
