'use client'

import { ChevronsUpDown, Check } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, use, useCallback, memo } from 'react'

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
import { cn, getHost } from '@/lib/utils'
import type { HostInfo } from '@/app/api/v1/hosts/route'

type UptimePromise = Promise<{
  uptime: string
  hostName: string
  version: string
} | null>

export type HostConfig = Omit<HostInfo, 'user'> & {
  promise: UptimePromise
}

interface HostSwitcherProps {
  hosts: HostConfig[]
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
  const { isMobile } = useSidebar()

  const activeHost = hosts[currentHostId] || hosts[0]

  const handleHostChange = useCallback(
    (hostId: number) => {
      if (hostId >= 0 && hostId < hosts.length) {
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set('host', hostId.toString())
        router.push(`${pathname}?${newParams.toString()}`)
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
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">
                    {activeHost.name || getHost(activeHost.host)}
                  </span>
                  <Suspense
                    fallback={
                      <StatusIndicator
                        title={['Connecting...']}
                        className="bg-gray-400 animate-pulse"
                      />
                    }
                  >
                    <HostStatus promise={activeHost.promise} />
                  </Suspense>
                </div>
                <Suspense fallback={<span className="truncate text-xs text-muted-foreground">...</span>}>
                  <HostVersion promise={activeHost.promise} />
                </Suspense>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
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
                  <Suspense
                    fallback={
                      <StatusIndicator
                        title={['Loading...']}
                        className="bg-gray-400 animate-pulse"
                      />
                    }
                  >
                    <HostStatus promise={host.promise} />
                  </Suspense>
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

export function HostStatus({ promise }: { promise: UptimePromise }) {
  const res = use(promise)

  const isOnline = res != null
  if (isOnline) {
    return <StatusIndicator className="bg-emerald-500" title={['Online']} />
  }

  return <StatusIndicator title={['Offline']} />
}

function HostVersion({ promise }: { promise: UptimePromise }) {
  const res = use(promise)

  if (res) {
    return (
      <span className="truncate text-xs text-muted-foreground">
        {res.version}
      </span>
    )
  }

  return (
    <span className="truncate text-xs text-muted-foreground">Offline</span>
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
