'use client'

import { Suspense, use } from 'react'
import { Settings, Info, Github } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuSkeleton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { HostSwitcher, type HostConfig } from '@/components/host-switcher'
import { menuItemsConfig } from '@/menu'
import type { HostInfo } from '@/app/api/v1/hosts/route'

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
