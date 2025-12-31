'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { memo, useCallback } from 'react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHostStatus } from '@/lib/swr/use-host-status'
import { buildUrl } from '@/lib/url/url-builder'
import { cn, getHost } from '@/lib/utils'

interface HostSwitcherProps {
  hosts: Array<Omit<HostInfo, 'user'>>
  currentHostId: number
}

/**
 * Host switcher component for sidebar header.
 * Uses DropdownMenu pattern (similar to TeamSwitcher from shadcn).
 * Shows host icon, name, and status in collapsed/expanded states.
 */
export function HostSwitcher({ hosts, currentHostId }: HostSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isMobile, state } = useSidebar()

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

/**
 * Host status for dropdown menu items using SWR.
 */
const HostStatusDropdown = memo(function HostStatusDropdown({
  hostId,
}: {
  hostId: number
}) {
  const { isOnline } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isOnline) {
    return <StatusIndicator className="bg-emerald-500" title={['Online']} />
  }

  return <StatusIndicator title={['Offline']} />
})

/**
 * Host version with status indicator for expanded sidebar state.
 */
function HostVersionWithStatus({ hostId }: { hostId: number }) {
  const { data, isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-gray-400 animate-pulse" />
        Loading...
      </span>
    )
  }

  if (isOnline && data) {
    return (
      <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
        <span className="flex-none size-2 rounded-full bg-emerald-500" />v
        {data.version}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
      <span className="flex-none size-2 rounded-full bg-red-400" />
      Offline
    </span>
  )
}

const StatusIndicator = memo(function StatusIndicator({
  title,
  className,
}: {
  title: string[]
  className?: string
}) {
  const isOnline = className !== undefined
  const statusText = isOnline ? 'Online' : 'Offline'

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="relative flex size-2 cursor-pointer"
            role="status"
            aria-label={statusText}
          >
            <span
              className={cn(
                'absolute inline-flex size-full rounded-full',
                !className && 'bg-red-400',
                className
              )}
              aria-hidden="true"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {title.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})
