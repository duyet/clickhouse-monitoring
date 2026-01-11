'use client'

import {
  ChevronsUpDown,
  Info,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { ClientOnly } from '@/components/client-only'
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
import { type AuthSession, signOut, useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

/**
 * GitHub icon SVG
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Check if user is authenticated (not guest)
  const { data: session } = useSession() as { data: AuthSession | null }
  const isAuthenticated = !!session?.user

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name || name === 'Guest') return 'G'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      // Reload page to reset state
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

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

  // User button shown in sidebar
  const userButton = (
    <SidebarMenuButton
      size="lg"
      className={cn(
        'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
        'transition-colors duration-200'
      )}
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback
          className={cn(
            'rounded-lg text-xs font-medium',
            // Guest styling - subtle muted appearance
            !isAuthenticated &&
              'bg-muted text-muted-foreground border border-border/50'
          )}
        >
          {isAuthenticated ? (
            getInitials(user.name)
          ) : (
            <UserIcon className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
    </SidebarMenuButton>
  )

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <ClientOnly fallback={userButton}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>{userButton}</DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                {/* User info header */}
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback
                        className={cn(
                          'rounded-lg text-xs font-medium',
                          !isAuthenticated &&
                            'bg-muted text-muted-foreground border border-border/50'
                        )}
                      >
                        {isAuthenticated ? (
                          getInitials(user.name)
                        ) : (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Menu items */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => (window.location.href = '/about')}
                  >
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <a
                      href="https://github.com/duyet/clickhouse-monitoring"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2 cursor-pointer"
                    >
                      <GitHubIcon className="h-4 w-4" />
                      <span>GitHub Repo</span>
                    </a>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault()
                      setSettingsOpen(true)
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ⌘,
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {/* Logout option - only for authenticated users */}
                {isAuthenticated && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      <span>{isLoggingOut ? 'Signing out...' : 'Log out'}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        </SidebarMenuItem>
      </SidebarMenu>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div />
      </SettingsDialog>
    </>
  )
}
