import { ChevronsUpDown, GlobeIcon, PlusIcon } from 'lucide-react'

import { HostMenuRow } from './host-menu-row'
import { HostVersionWithStatus } from './host-version-status'
import {
  LogoStatusIndicator,
  LogoStatusIndicatorSkeleton,
} from './logo-status-indicator'
import { useState } from 'react'
import { AddHostDialog } from '@/components/connections'
import { ChmonitorLogo } from '@/components/icons/chmonitor-logo'
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
import { isServerHost, useMergedHosts } from '@/lib/swr/use-merged-hosts'
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
  const { hosts, isLoading, error, isUnauthorized } = useMergedHosts()
  const currentHostId = useHostId()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const activeHost =
    hosts.find((h) => h.id === currentHostId) ?? hosts[0] ?? null
  const showExpanded = isMobile || state === 'expanded'

  const handleHostChange = (hostId: number) => {
    const url = buildUrl(pathname, { host: hostId }, searchParams)
    router.push(url)
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
                <ChmonitorLogo width={20} height={20} className="size-5" />
                {!showExpanded && <LogoStatusIndicatorSkeleton />}
              </div>
              {showExpanded && (
                <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight">
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

  // No active host: keep switcher shape and surface why
  if (!activeHost) {
    const { label, hint } = isUnauthorized
      ? { label: 'Sign in to load hosts', hint: 'Authentication required' }
      : error
        ? { label: "Couldn't load hosts", hint: 'Tap to retry from a page' }
        : { label: 'No host', hint: 'Add a host to get started' }

    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                    !showExpanded && 'justify-center'
                  )}
                  data-testid="host-switcher-empty"
                  aria-label={showExpanded ? undefined : label}
                >
                  <div className="relative">
                    <ChmonitorLogo
                      width={20}
                      height={20}
                      className="size-5 opacity-50"
                    />
                  </div>
                  {showExpanded && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-muted-foreground">
                          {label}
                        </span>
                        <span className="truncate text-xs text-muted-foreground/70">
                          {hint}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                <DropdownMenuItem
                  onClick={() => setAddDialogOpen(true)}
                  data-testid="add-host"
                >
                  <PlusIcon className="size-4" />
                  Add host…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <AddHostDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </>
    )
  }

  const showDropdown = true

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          {showDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                    !showExpanded && 'justify-center'
                  )}
                  data-testid="host-switcher"
                  // When expanded the host name + version are visible, so the
                  // accessible name comes from that content (WCAG 2.5.3 Label
                  // in Name — a static aria-label can't include the live
                  // version). When collapsed to an icon, supply the name.
                  aria-label={
                    showExpanded
                      ? undefined
                      : `Select ClickHouse host. Current: ${activeHost.name || getHost(activeHost.host)}`
                  }
                >
                  <div className="relative">
                    <ChmonitorLogo width={20} height={20} className="size-5" />
                    {!showExpanded && isServerHost(activeHost.source) && (
                      <LogoStatusIndicator hostId={activeHost.id} />
                    )}
                  </div>
                  {showExpanded && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="flex items-center gap-1.5 truncate font-semibold">
                          <span className="truncate">
                            {activeHost.name || getHost(activeHost.host)}
                          </span>
                          {activeHost.source === 'demo' && <DemoBadge />}
                        </span>
                        {isServerHost(activeHost.source) ? (
                          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <HostVersionWithStatus hostId={activeHost.id} />
                            {activeHost.readOnly && <span>· read-only</span>}
                          </span>
                        ) : (
                          <span className="truncate text-xs text-muted-foreground">
                            {activeHost.source === 'database'
                              ? 'Saved to server'
                              : 'Saved in browser'}
                          </span>
                        )}
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
                {hosts.map((host) => (
                  <DropdownMenuItem
                    key={`${host.source}-${host.id}`}
                    onClick={() => handleHostChange(host.id)}
                    className="gap-2 p-2"
                    data-testid={`host-option-${host.id}`}
                  >
                    {!isServerHost(host.source) && (
                      <GlobeIcon className="size-3 shrink-0 text-muted-foreground" />
                    )}
                    <HostMenuRow
                      hostId={isServerHost(host.source) ? host.id : null}
                      hostName={host.name || getHost(host.host)}
                      isActive={host.id === currentHostId}
                      skipStatus={!isServerHost(host.source)}
                    />
                    {host.source === 'demo' && (
                      <DemoBadge className="ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setAddDialogOpen(true)}
                  data-testid="add-host"
                  className="gap-2 text-muted-foreground"
                >
                  <PlusIcon className="size-4" />
                  Add host…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SidebarMenuButton size="lg" asChild>
              <div
                className={cn(
                  'flex gap-2',
                  showExpanded ? 'items-center' : 'items-center justify-center'
                )}
              >
                <div className="relative">
                  <ChmonitorLogo width={20} height={20} className="size-5" />
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
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <AddHostDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </>
  )
}

/** Small "Demo" pill marking the public read-only cloud demo host. */
function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded bg-muted px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground',
        className
      )}
    >
      Demo
    </span>
  )
}
