'use client'

import { menuItemsConfig } from '@/menu'

import { LoginButton } from '@/components/auth/login-button'
import { HostSwitcher } from '@/components/host/host-switcher'
import { NavUser } from '@/components/nav-user'
import { NavMain } from '@/components/navigation/nav-main'
import { TeamSwitcher } from '@/components/organizations/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { type AuthSession, useSession } from '@/lib/auth/client'
import { useAuthConfig } from '@/lib/auth/use-auth-config'

const guestUser = {
  name: 'Guest',
  email: 'guest@local',
  avatar: '',
}

export function AppSidebar() {
  const { data: session, isPending } = useSession() as {
    data: AuthSession | null
    isPending: boolean
  }
  const { isAuthEnabled, isLoading: isAuthConfigLoading } = useAuthConfig()

  // Determine user to display
  const user = session?.user
    ? {
        name: session.user.name || 'User',
        email: session.user.email || '',
        avatar: session.user.image || '',
      }
    : guestUser

  const isAuthenticated = !!session?.user
  const showLoginButton = isAuthEnabled && !isAuthenticated

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <HostSwitcher />
        {/* Team Switcher - only shown when authenticated */}
        {isAuthenticated && (
          <>
            <SidebarSeparator className="my-2" />
            <TeamSwitcher />
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={menuItemsConfig} />
      </SidebarContent>

      <SidebarFooter>
        {isPending || isAuthConfigLoading ? (
          // Loading state
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex h-12 items-center gap-2 px-2">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-2 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : showLoginButton ? (
          // Show login button when auth is enabled but user not authenticated
          <SidebarMenu>
            <SidebarMenuItem className="px-2 py-2">
              <LoginButton fullWidth variant="outline" />
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          // Show user menu (guest or authenticated)
          <NavUser user={user} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
