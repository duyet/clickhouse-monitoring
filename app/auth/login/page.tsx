'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { type AuthSession, signIn, useSession } from '@/lib/auth/client'
import { useAuthConfig } from '@/lib/auth/use-auth-config'
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

/**
 * Google icon SVG with brand colors
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

/**
 * ClickHouse logo for branding
 */
function ClickHouseLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.333 10h-2.667v4h2.667v-4zm-21.333 0v4h2.667v-4h-2.667zm5.333-10v24h2.667v-24h-2.667zm5.334 0v24h2.666v-24h-2.666zm5.333 0v24h2.667v-24h-2.667z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession() as {
    data: AuthSession | null
    isPending: boolean
  }
  const {
    isAuthEnabled,
    providers,
    isLoading: isConfigLoading,
  } = useAuthConfig()

  const [isLoading, setIsLoading] = useState<'github' | 'google' | null>(null)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get redirect URL from query params or default to overview
  const getRedirectUrl = useCallback(() => {
    if (typeof window === 'undefined') return '/overview'
    const params = new URLSearchParams(window.location.search)
    return params.get('redirect') || '/overview'
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user && !isSessionLoading) {
      router.push(getRedirectUrl())
    }
  }, [session, isSessionLoading, router, getRedirectUrl])

  // Check for error in URL (from OAuth failure)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [])

  const handleSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(provider)
    setError(null)

    // Store redirect intent and remember me preference
    // The callback page will use this to set appropriate session duration
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', getRedirectUrl())
      sessionStorage.setItem('auth_remember_me', String(rememberMe))
    }

    try {
      await signIn.social({
        provider,
        callbackURL: '/auth/callback',
      })
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Failed to start sign in. Please try again.')
      setIsLoading(null)
    }
  }

  // Show loading state while checking session/config
  if (isSessionLoading || isConfigLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If auth is not enabled, show message
  if (!isAuthEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <ClickHouseLogo className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Authentication Not Configured</CardTitle>
            <CardDescription>
              Authentication is not enabled for this deployment. Contact your
              administrator to enable OAuth providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/overview')}
            >
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasGithub = providers.github
  const hasGoogle = providers.google

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-orange-500/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <Card className="w-full max-w-md border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10 ring-1 ring-primary/20">
            <ClickHouseLogo className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your ClickHouse monitoring dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-3">
            {hasGithub && (
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  'group relative w-full overflow-hidden transition-all duration-300',
                  'hover:border-foreground/30 hover:bg-foreground/5',
                  isLoading === 'github' && 'pointer-events-none'
                )}
                onClick={() => handleSignIn('github')}
                disabled={isLoading !== null}
              >
                {isLoading === 'github' ? (
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                ) : (
                  <GitHubIcon className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span className="font-medium">
                  {isLoading === 'github'
                    ? 'Redirecting to GitHub...'
                    : 'Continue with GitHub'}
                </span>
              </Button>
            )}

            {hasGoogle && (
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  'group relative w-full overflow-hidden transition-all duration-300',
                  'hover:border-foreground/30 hover:bg-foreground/5',
                  isLoading === 'google' && 'pointer-events-none'
                )}
                onClick={() => handleSignIn('google')}
                disabled={isLoading !== null}
              >
                {isLoading === 'google' ? (
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                ) : (
                  <GoogleIcon className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span className="font-medium">
                  {isLoading === 'google'
                    ? 'Redirecting to Google...'
                    : 'Continue with Google'}
                </span>
              </Button>
            )}
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Guest access */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/overview')}
          >
            Continue as Guest
          </Button>

          {/* Terms notice */}
          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ClickHouse Monitoring Dashboard
      </p>
    </div>
  )
}
