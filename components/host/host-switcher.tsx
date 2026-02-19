'use client'

import { Check, ChevronsUpDown, Database, Plus, Settings } from 'lucide-react'

import { AddConnectionDialog } from './add-connection-dialog'
import { HostStatusDropdown } from './host-status-dropdown'
import { HostVersionWithStatus } from './host-version-status'
import {
  LogoStatusIndicator,
  LogoStatusIndicatorSkeleton,
} from './logo-status-indicator'
import { ManageConnectionsDialog } from './manage-connections-dialog'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
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
import { useCustomHosts } from '@/lib/hooks/use-custom-hosts'
import { useHostId } from '@/lib/swr'
import { useHosts } from '@/lib/swr/use-hosts'
import { buildUrl } from '@/lib/url/url-builder'
import { getHost } from '@/lib/utils'

/**
 * Host switcher component for sidebar header.
 *
 * Provides dropdown menu for switching between ClickHouse hosts.
 * Shows host icon, name, and status in collapsed/expanded states.
 * Includes options to add new custom connections and manage existing ones.
 */
export function HostSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isMobile, state } = useSidebar()
  const { hosts, isLoading } = useHosts()
  const { hosts: customHosts } = useCustomHosts()
  const currentHostId = useHostId()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)

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

  const handleHostAdded = useCallback(() => {
    // After adding, the new host will be at the end of the merged list.
    // We need to wait for useHosts to re-merge, so use a microtask.
    // The new custom host index = current hosts length (before the add).
    const newIndex = hosts.length
    // Use setTimeout to let state propagate from useCustomHosts → useHosts
    setTimeout(() => {
      const url = buildUrl(pathname, { host: newIndex }, searchParams)
      router.push(url)
    }, 0)
  }, [hosts.length, pathname, searchParams, router])

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

  // Account for custom hosts when determining single-host mode
  const isSingleHost = hosts.length <= 1 && customHosts.length === 0

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          {isSingleHost ? (
            // Single host: simplified display without dropdown
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
                      {activeHost.source === 'custom' ? (
                        <Database className="size-5" />
                      ) : (
                        <ClickHouseLogo
                          width={20}
                          height={20}
                          className="size-5"
                        />
                      )}
                      {state === 'collapsed' &&
                        activeHost.source !== 'custom' && (
                          <LogoStatusIndicator hostId={activeHost.id} />
                        )}
                    </div>
                    {state === 'expanded' && (
                      <>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {activeHost.name || getHost(activeHost.host)}
                          </span>
                          {activeHost.source !== 'custom' ? (
                            <HostVersionWithStatus hostId={activeHost.id} />
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Custom connection
                            </span>
                          )}
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
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  ClickHouse Hosts
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hosts.map((host, index) => (
                  <DropdownMenuItem
                    key={
                      host.source === 'custom'
                        ? `custom-${host.host}-${index}`
                        : `env-${host.host}-${host.id}`
                    }
                    onClick={() => handleHostChange(index)}
                    className="gap-2 p-2"
                    data-testid={`host-option-${index}`}
                  >
                    <div className="flex flex-1 items-center gap-2">
                      {host.source === 'custom' ? (
                        <Database className="text-muted-foreground size-3.5 shrink-0" />
                      ) : null}
                      <span className="truncate">
                        {host.name || getHost(host.host)}
                      </span>
                      {host.source !== 'custom' && (
                        <HostStatusDropdown hostId={host.id} />
                      )}
                    </div>
                    {index === currentHostId && (
                      <Check className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}

                {/* Custom host actions */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2 p-2"
                >
                  <Plus className="size-4" />
                  <span>Connect New Cluster</span>
                </DropdownMenuItem>
                {customHosts.length > 0 && (
                  <DropdownMenuItem
                    onClick={() => setManageDialogOpen(true)}
                    className="gap-2 p-2"
                  >
                    <Settings className="size-4" />
                    <span>Manage Connections</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Dialogs rendered outside dropdown to avoid portal issues */}
      <AddConnectionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onHostAdded={handleHostAdded}
      />
      <ManageConnectionsDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
      />
    </>
  )
}
