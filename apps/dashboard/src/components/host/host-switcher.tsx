import { ChevronsUpDown } from 'lucide-react'

import { HostMenuRow } from './host-menu-row'
import { HostVersionWithStatus } from './host-version-status'
import {
  LogoStatusIndicator,
  LogoStatusIndicatorSkeleton,
} from './logo-status-indicator'
import { ClickHouseLogo } from '@/components/icons/clickhouse-logo'
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
import { Skeleton } from '@/components/ui/skeleton'
import { usePathname, useRouter, useSearchParams } from '@/lib/next-compat'
import { useHostId } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'
import { buildUrl } from '@/lib/url/url-builder'
import { cn, getHost } from '@/lib/utils'

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
  const { hosts, isLoading, error, isUnauthorized } = useHosts()
  const currentHostId = useHostId()

  const activeHost = hosts[currentHostId] || hosts[0]
  const showExpanded = isMobile || state === 'expanded'

  const handleHostChange = (hostId: number) => {
    if (hostId >= 0 && hostId < hosts.length) {
      const url = buildUrl(pathname, { host: hostId }, searchParams)
      router.push(url)
    }
  }

  // Show skeleton while loading hosts
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <div
              className={cn(
                'flex gap-2',
                showExpanded ? 'items-center' : 'items-center justify-center'
              )}
            >
              <div className="relative">
                <ClickHouseLogo width={20} height={20} className="size-5" />
                {!showExpanded && <LogoStatusIndicatorSkeleton />}
              </div>
              {showExpanded && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              )}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // No active host: instead of disappearing, keep the switcher's shape and
  // surface WHY there is no host — unauthorized (sign in), a load error, or
  // genuinely none configured. Same layout as the normal single-host view.
  if (!activeHost) {
    const { label, hint } = isUnauthorized
      ? { label: 'Sign in to load hosts', hint: 'Authentication required' }
      : error
        ? { label: "Couldn't load hosts", hint: 'Tap to retry from a page' }
        : { label: 'No host', hint: 'None configured' }

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <div
              className={cn(
                'flex gap-2',
                showExpanded ? 'items-center' : 'items-center justify-center'
              )}
              data-testid="host-switcher-empty"
              aria-label={label}
              title={showExpanded ? undefined : label}
            >
              <div className="relative">
                <ClickHouseLogo
                  width={20}
                  height={20}
                  className="size-5 opacity-50"
                />
              </div>
              {showExpanded && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-muted-foreground">
                    {label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground/70">
                    {hint}
                  </span>
                </div>
              )}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // For single host, render simplified view without dropdown
  const isSingleHost = hosts.length <= 1

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isSingleHost ? (
          // Single host: simplified display without dropdown
          <SidebarMenuButton size="lg" asChild>
            <div
              className={cn(
                'flex gap-2',
                showExpanded ? 'items-center' : 'items-center justify-center'
              )}
            >
              <div className="relative">
                <ClickHouseLogo width={20} height={20} className="size-5" />
                {!showExpanded && (
                  <LogoStatusIndicator hostId={activeHost.id} />
                )}
              </div>
              {showExpanded && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeHost.name || getHost(activeHost.host)}
                  </span>
                  <HostVersionWithStatus hostId={activeHost.id} />
                </div>
              )}
            </div>
          </SidebarMenuButton>
        ) : (
          // Multiple hosts: full switcher with dropdown
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="host-switcher"
                aria-label={`Select ClickHouse host. Current: ${activeHost.name || getHost(activeHost.host)}`}
                asChild
              >
                <div
                  className={cn(
                    'flex gap-2',
                    showExpanded
                      ? 'items-center'
                      : 'items-center justify-center'
                  )}
                >
                  <div className="relative">
                    <ClickHouseLogo width={20} height={20} className="size-5" />
                    {!showExpanded && (
                      <LogoStatusIndicator hostId={activeHost.id} />
                    )}
                  </div>
                  {showExpanded && (
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
                </div>
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
                  <HostMenuRow
                    hostId={host.id}
                    hostName={host.name || getHost(host.host)}
                    isActive={index === currentHostId}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
