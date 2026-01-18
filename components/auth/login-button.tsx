'use client'

import { LogIn } from 'lucide-react'

import { useState } from 'react'
import {
  GitHubIcon,
  GoogleIcon,
  OAuthSpinner,
} from '@/components/icons/oauth-icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signIn } from '@/lib/auth/client'
import { useAuthConfig } from '@/lib/auth/use-auth-config'
import { cn } from '@/lib/utils'

interface LoginButtonProps {
  redirectTo?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  fullWidth?: boolean
}

type Provider = 'github' | 'google'

function getSingleProvider(
  hasGithub: boolean,
  hasGoogle: boolean
): Provider | null {
  if (hasGithub && !hasGoogle) return 'github'
  if (!hasGithub && hasGoogle) return 'google'
  return null
}

export function LoginButton({
  redirectTo = '/',
  variant = 'outline',
  size = 'default',
  fullWidth = false,
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const {
    isAuthEnabled,
    providers,
    isLoading: isConfigLoading,
  } = useAuthConfig()

  async function handleSignIn(provider: Provider) {
    setIsLoading(provider)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', redirectTo)
    }

    try {
      await signIn.social({
        provider,
        callbackURL: redirectTo,
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(null)
    }
  }

  if (!isAuthEnabled && !isConfigLoading) {
    return null
  }

  const hasProviders = providers.github || providers.google
  if (!hasProviders && !isConfigLoading) {
    return null
  }

  const singleProvider = getSingleProvider(providers.github, providers.google)

  const buttonClassName = cn(
    'group relative overflow-hidden transition-all duration-300',
    'hover:shadow-[0_0_20px_rgba(255,136,0,0.15)]',
    'hover:border-orange-500/50 dark:hover:border-orange-400/50',
    fullWidth && 'w-full'
  )

  if (singleProvider) {
    const Icon = singleProvider === 'github' ? GitHubIcon : GoogleIcon
    const label = singleProvider === 'github' ? 'GitHub' : 'Google'

    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleSignIn(singleProvider)}
        disabled={isLoading !== null || isConfigLoading}
        className={buttonClassName}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {isLoading ? (
          <OAuthSpinner className="relative mr-2 h-4 w-4" />
        ) : (
          <Icon className="relative mr-2 h-4 w-4" />
        )}
        <span className="relative font-medium tracking-tight">
          {isLoading ? 'Signing in...' : `Sign in with ${label}`}
        </span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isConfigLoading}
          className={buttonClassName}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <LogIn className="relative mr-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          <span className="relative font-medium tracking-tight">Sign in</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          'w-56 overflow-hidden',
          'border-border/60 shadow-xl shadow-black/5',
          'backdrop-blur-xl'
        )}
      >
        {providers.github && (
          <ProviderMenuItem
            provider="github"
            isLoading={isLoading === 'github'}
            disabled={isLoading !== null}
            onSelect={() => handleSignIn('github')}
          />
        )}

        {providers.github && providers.google && (
          <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        )}

        {providers.google && (
          <ProviderMenuItem
            provider="google"
            isLoading={isLoading === 'google'}
            disabled={isLoading !== null}
            onSelect={() => handleSignIn('google')}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ProviderMenuItemProps {
  provider: Provider
  isLoading: boolean
  disabled: boolean
  onSelect: () => void
}

function ProviderMenuItem({
  provider,
  isLoading,
  disabled,
  onSelect,
}: ProviderMenuItemProps) {
  const Icon = provider === 'github' ? GitHubIcon : GoogleIcon
  const label = provider === 'github' ? 'GitHub' : 'Google'
  const description =
    provider === 'github'
      ? 'Recommended for developers'
      : 'Use your Google account'

  return (
    <DropdownMenuItem
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'group cursor-pointer gap-3 py-3 transition-all duration-200',
        'focus:bg-foreground/5',
        isLoading && 'opacity-70'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg',
          'bg-foreground/5 transition-all duration-200',
          'group-hover:bg-foreground/10 group-hover:scale-105'
        )}
      >
        {isLoading ? <OAuthSpinner /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">Continue with {label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </DropdownMenuItem>
  )
}
