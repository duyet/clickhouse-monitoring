'use client'

import { Check, ChevronsUpDown, Plus } from 'lucide-react'

import { HostStatusDropdown } from './host-status-dropdown'
import { HostVersionWithStatus } from './host-version-status'
import {
  LogoStatusIndicator,
  LogoStatusIndicatorSkeleton,
} from './logo-status-indicator'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
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
import { type AuthSession, useSession } from '@/lib/auth/client'
import { useAuthConfig } from '@/lib/auth/use-auth-config'
import { useHostId } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'
import { buildUrl } from '@/lib/url/url-builder'
import { getHost } from '@/lib/utils'

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
  const { hosts, isLoading } = useHosts()
  const currentHostId = useHostId()

  // Auth state for "Add Host" action
  const { data: session } = useSession() as { data: AuthSession | null }
  const { isAuthEnabled } = useAuthConfig()
  const isAuthenticated = !!session?.user

  const activeHost = hosts[currentHostId] || hosts[0]

  /**
   * Handle "Add Host" action
   * If auth is enabled and user is not authenticated, redirect to login
   * Otherwise, navigate directly to add host page
   */
  const handleAddHost = useCallback(() => {
    if (isAuthEnabled && !isAuthenticated) {
      // Store intent to add host after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect', '/hosts/new')
      }
      router.push('/auth/login?redirect=/hosts/new')
    } else {
      router.push('/hosts/new')
    }
  }, [isAuthEnabled, isAuthenticated, router])

  const handleHostChange = useCallback(
    (hostId: number) => {
      if (hostId >= 0 && hostId < hosts.length) {
        const url = buildUrl(pathname, { host: hostId }, searchParams)
        router.push(url)
      }
    },
    [searchParams, pathname, router, hosts.length]
  )

  // Show skeleton while loading hosts
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <div
              className={`flex gap-2 ${state === 'expanded' ? 'items-center' : 'items-center justify-center'}`}
            >
              <div className="relative">
                <ClickHouseLogo width={20} height={20} className="size-5" />
                {state === 'collapsed' && <LogoStatusIndicatorSkeleton />}
              </div>
              {state === 'expanded' && (
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

  // Don't render switcher if no hosts configured
  if (!activeHost) {
    return null
  }

  // Show dropdown if multiple hosts OR if auth is enabled (so users can add hosts)
  // Only show simplified view for single host when auth is not enabled
  const showDropdown = hosts.length > 1 || isAuthEnabled

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {!showDropdown ? (
          // Single host without auth: simplified display without dropdown
          <SidebarMenuButton size="lg" asChild>
            <div
              className={`flex gap-2 ${state === 'expanded' ? 'items-center' : 'items-center justify-center'}`}
            >
              <div className="relative">
                <ClickHouseLogo width={20} height={20} className="size-5" />
                {state === 'collapsed' && (
                  <LogoStatusIndicator hostId={activeHost.id} />
                )}
              </div>
              {state === 'expanded' && (
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
                  className={`flex gap-2 ${state === 'expanded' ? 'items-center' : 'items-center justify-center'}`}
                >
                  <div className="relative">
                    <ClickHouseLogo width={20} height={20} className="size-5" />
                    {state === 'collapsed' && (
                      <LogoStatusIndicator hostId={activeHost.id} />
                    )}
                  </div>
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

              {/* Add Host action */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleAddHost}
                className="gap-2 p-2 text-muted-foreground hover:text-foreground"
                data-testid="add-host-action"
              >
                <Plus className="size-4" />
                <span>Add ClickHouse Host</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
