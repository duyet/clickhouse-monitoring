'use client'

import {
  ChevronsUpDown,
  Github,
  Info,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react'

import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { SettingsDialog } from '@/components/settings'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

/**
 * Clerk-integrated navigation user menu.
 *
 * Displays:
 * - Sign In / Sign Up buttons when not authenticated
 * - User button with avatar and menu when authenticated
 */
export function ClerkNavWrapper() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { isMobile } = useSidebar()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Keyboard shortcut for settings (Cmd/Ctrl + ,)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Loading state - show skeleton
  if (!isLoaded) {
    return <UserSkeleton />
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          {/* Not signed in - show Sign In button */}
          {!isSignedIn && (
            <SignInButton mode="modal">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="nav-user-trigger"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sign In</span>
                  <span className="truncate text-xs text-muted-foreground">
                    to access features
                  </span>
                </div>
              </SidebarMenuButton>
            </SignInButton>
          )}

          {/* Signed in - show user menu with avatar */}
          {isSignedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  data-testid="nav-user-trigger"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName ?? 'User'}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span
                      className="truncate font-medium"
                      data-testid="nav-user-name"
                    >
                      {user?.fullName ?? 'User'}
                    </span>
                    <span
                      className="truncate text-xs"
                      data-testid="nav-user-email"
                    >
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName ?? 'User'}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getUserInitials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.fullName ?? 'User'}
                      </span>
                      <span className="truncate text-xs">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <a
                      href="https://dashboard.clerk.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>Account Settings</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={() => (window.location.href = '/about')}
                    data-testid="nav-user-about"
                  >
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="https://github.com/duyet/clickhouse-monitoring"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                      data-testid="nav-user-github"
                    >
                      <Github className="h-4 w-4" />
                      <span>GitHub Repo</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onSelect={(e) => {
                      e.preventDefault()
                      setSettingsOpen(true)
                    }}
                    data-testid="nav-user-settings"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ⌘,
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <SignOutButton>
                  <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div />
      </SettingsDialog>
    </>
  )
}

/**
 * Skeleton component shown while Clerk is loading.
 */
function UserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" disabled data-testid="nav-user-trigger">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="grid flex-1 gap-1">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * Get user initials from full name.
 */
function getUserInitials(fullName: string | undefined | null): string {
  if (!fullName) return 'U'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase()
  }
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase()
}
