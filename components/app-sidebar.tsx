'use client'

import { Suspense, use } from 'react'
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
import { ClickHouseHostSelector } from '@/components/clickhouse-host-selector'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import { menuItemsConfig } from '@/menu'

const GITHUB_REPO = 'https://github.com/duyet/clickhouse-monitoring'

interface AppSidebarProps {
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
  currentHostId: number
}

export function AppSidebar({
  hostsPromise,
  currentHostId,
}: AppSidebarProps) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="gap-4">
        <Suspense
          fallback={
            <div className="h-8 w-24 animate-shimmer rounded bg-muted" />
          }
        >
          <HostSelectorWrapper
            hostsPromise={hostsPromise}
            currentHostId={currentHostId}
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
    </Sidebar>
  )
}

interface HostSelectorWrapperProps {
  hostsPromise: Promise<Array<Omit<HostInfo, 'user'>>>
  currentHostId: number
}

/**
 * Fetch host status from API
 */
async function fetchHostStatus(hostId: number): Promise<{
  uptime: string
  hostName: string
  version: string
} | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const [hostnameRes, versionRes, uptimeRes] = await Promise.all([
      fetch(`/api/v1/charts/hostname?hostId=${hostId}`, {
        signal: controller.signal,
      }),
      fetch(`/api/v1/charts/version?hostId=${hostId}`, {
        signal: controller.signal,
      }),
      fetch(`/api/v1/charts/uptime-readable?hostId=${hostId}`, {
        signal: controller.signal,
      }),
    ])

    clearTimeout(timeoutId)

    if (!hostnameRes.ok || !versionRes.ok || !uptimeRes.ok) {
      return null
    }

    const [hostnameData, versionData, uptimeData] = await Promise.all([
      hostnameRes.json() as Promise<{ success: boolean; data?: Array<{ val: string }> }>,
      versionRes.json() as Promise<{ success: boolean; data?: Array<{ val: string }> }>,
      uptimeRes.json() as Promise<{ success: boolean; data?: Array<{ val: string }> }>,
    ])

    const hostName = hostnameData?.data?.[0]?.val ?? ''
    const version = versionData?.data?.[0]?.val ?? ''
    const uptime = uptimeData?.data?.[0]?.val ?? ''

    if (!hostName && !version && !uptime) {
      return null
    }

    return { hostName, version, uptime }
  } catch {
    return null
  }
}

function HostSelectorWrapper({
  hostsPromise,
  currentHostId,
}: HostSelectorWrapperProps) {
  const hosts = use(hostsPromise)

  const configs = hosts.map((host) => ({
    ...host,
    promise: fetchHostStatus(host.id),
  }))

  return (
    <ClickHouseHostSelector
      currentHostId={currentHostId}
      configs={configs}
    />
  )
}
