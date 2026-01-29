'use client'

import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'

import { CreateOrgModal } from './create-org-modal'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
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
  type AuthSession,
  organization,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from '@/lib/auth/client'
import { cn } from '@/lib/utils'

/**
 * Organization type from Better Auth
 */
interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
}

interface TeamSwitcherProps {
  /**
   * Callback when organization changes
   */
  onOrgChange?: (org: Organization) => void
}

/**
 * Team Switcher Component
 *
 * Displays a dropdown in the sidebar for switching between organizations.
 * Shows current org with ability to switch or create new orgs.
 * Only visible when user is authenticated and part of organizations.
 */
export function TeamSwitcher({ onOrgChange }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const { data: session } = useSession() as { data: AuthSession | null }
  const { data: orgs, isPending: isLoadingOrgs } = useListOrganizations()
  const { data: activeOrg, isPending: isLoadingActive } =
    useActiveOrganization()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Handle organization switch - defined before early returns
  const handleOrgSwitch = useCallback(
    async (org: Organization) => {
      if (org.id === activeOrg?.id) return

      setIsSwitching(true)
      try {
        await organization.setActive({ organizationId: org.id })
        onOrgChange?.(org)
      } catch (error) {
        console.error('Failed to switch organization:', error)
      } finally {
        setIsSwitching(false)
      }
    },
    [activeOrg?.id, onOrgChange]
  )

  // Don't render if not authenticated
  if (!session?.user) {
    return null
  }

  // Loading state
  if (isLoadingOrgs || isLoadingActive) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-12 items-center gap-2 px-2">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-2 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // No organizations yet - show create button
  if (!orgs || orgs.length === 0) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <CreateOrgModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </>
    )
  }

  // Current organization (use active or first available)
  const currentOrg = activeOrg || orgs[0]

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
                  isSwitching && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {currentOrg?.logo ? (
                    <Image
                      src={currentOrg.logo}
                      alt={currentOrg.name}
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentOrg?.name || 'Select Organization'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {currentOrg?.slug || 'No organization selected'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>

              {orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrgSwitch(org)}
                  className="cursor-pointer gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    {org.logo ? (
                      <Image
                        src={org.logo}
                        alt={org.name}
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                  {org.id === currentOrg?.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 p-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="font-medium text-muted-foreground">
                  Create Organization
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrgModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  )
}
