'use client'

import { LogIn, RefreshCw } from 'lucide-react'

import { useEffect, useState } from 'react'
import {
  GitHubIcon,
  GoogleIcon,
  OAuthSpinner,
} from '@/components/icons/oauth-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type AuthSession, signIn, useSession } from '@/lib/auth/client'
import { useAuthConfig } from '@/lib/auth/use-auth-config'
import { cn } from '@/lib/utils'

type Provider = 'github' | 'google'

interface SessionExpiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated?: () => void
}

/**
 * Modal overlay shown when the user's session expires while using the app.
 * Allows re-authentication or continuing as guest.
 */
export function SessionExpiredModal({
  open,
  onOpenChange,
  onAuthenticated,
}: SessionExpiredModalProps) {
  const { data: session } = useSession() as { data: AuthSession | null }
  const { providers } = useAuthConfig()
  const [isLoading, setIsLoading] = useState<Provider | null>(null)

  useEffect(() => {
    if (session?.user && open) {
      onOpenChange(false)
      onAuthenticated?.()
    }
  }, [session, open, onOpenChange, onAuthenticated])

  async function handleSignIn(provider: Provider) {
    setIsLoading(provider)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', window.location.pathname)
    }

    try {
      await signIn.social({
        provider,
        callbackURL: '/auth/callback',
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-center text-xl">
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-center">
            Your session has expired. Sign in again to continue where you left
            off.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          {providers.github && (
            <OAuthButton
              provider="github"
              isLoading={isLoading === 'github'}
              disabled={isLoading !== null}
              onClick={() => handleSignIn('github')}
            />
          )}

          {providers.google && (
            <OAuthButton
              provider="google"
              isLoading={isLoading === 'google'}
              disabled={isLoading !== null}
              onClick={() => handleSignIn('google')}
            />
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Continue as Guest
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Your unsaved work will be preserved after signing in.
        </p>
      </DialogContent>
    </Dialog>
  )
}

interface OAuthButtonProps {
  provider: Provider
  isLoading: boolean
  disabled: boolean
  onClick: () => void
}

function OAuthButton({
  provider,
  isLoading,
  disabled,
  onClick,
}: OAuthButtonProps) {
  const Icon = provider === 'github' ? GitHubIcon : GoogleIcon
  const label = provider === 'github' ? 'GitHub' : 'Google'

  return (
    <Button
      variant="outline"
      className={cn(
        'w-full transition-all duration-200',
        'hover:border-foreground/30 hover:bg-foreground/5'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {isLoading ? (
        <OAuthSpinner className="mr-2 h-4 w-4" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      Continue with {label}
    </Button>
  )
}

/**
 * Hook to detect session expiration.
 * Returns true when a previously authenticated session has expired.
 */
export function useSessionExpired() {
  const { data: session, isPending } = useSession() as {
    data: AuthSession | null
    isPending: boolean
  }
  const [wasAuthenticated, setWasAuthenticated] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (isPending) return

    if (session?.user) {
      setWasAuthenticated(true)
      setIsExpired(false)
    } else if (wasAuthenticated && !session?.user) {
      setIsExpired(true)
    }
  }, [session, isPending, wasAuthenticated])

  return {
    isExpired,
    reset: () => {
      setIsExpired(false)
      setWasAuthenticated(false)
    },
  }
}
