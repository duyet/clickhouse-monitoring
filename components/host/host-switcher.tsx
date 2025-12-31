'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { HostInfo } from '@/app/api/v1/hosts/route'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { buildUrl } from '@/lib/url/url-builder'
import { getHost } from '@/lib/utils'
import { HostStatusDropdown } from './host-status-dropdown'
import { HostVersionWithStatus } from './host-version-status'
import { useHosts } from '@/lib/swr/use-hosts'
import { useHostId } from '@/lib/swr'

/**
 * Host switcher component for sidebar header.
 *
 * Provides dropdown menu for switching between ClickHouse hosts.
 * Shows host icon, name, and status in collapsed/expanded states.
 */
export function HostSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isMobile, state } = useSidebar()
  const { hosts } = useHosts()
  const currentHostId = useHostId()


  const activeHost = hosts[currentHostId] || hosts[0]

  const handleHostChange = useCallback(
    (hostId: number) => {
      if (hostId >= 0 && hostId < hosts.length) {
        const url = buildUrl(pathname, { host: hostId }, searchParams)
        router.push(url)
      }
    },
    [searchParams, pathname, router, hosts.length]
  )

  if (!activeHost) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="host-switcher"
              aria-label={`Select ClickHouse host. Current: ${activeHost.name || getHost(activeHost.host)}`}
            >
              {state === 'expanded' && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeHost.name || getHost(activeHost.host)}
                    </span>
                    <HostVersionWithStatus hostId={activeHost.id} />
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              ClickHouse Hosts
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hosts.map((host, index) => (
              <DropdownMenuItem
                key={host.host + host.id}
                onClick={() => handleHostChange(index)}
                className="gap-2 p-2"
                data-testid={`host-option-${index}`}
              >
                <div className="flex flex-1 items-center gap-2">
                  <span className="truncate">
                    {host.name || getHost(host.host)}
                  </span>
                  <HostStatusDropdown hostId={host.id} />
                </div>
                {index === currentHostId && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
