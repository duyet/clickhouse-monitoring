'use client'

import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  AccessDenied: {
    title: 'Access Denied',
    description:
      'You do not have permission to sign in. Please contact your administrator.',
  },
  Configuration: {
    title: 'Configuration Error',
    description:
      'There is a problem with the server configuration. Please contact your administrator.',
  },
  Verification: {
    title: 'Verification Failed',
    description:
      'The verification link may have expired or already been used. Please try signing in again.',
  },
  OAuthSignin: {
    title: 'Sign In Error',
    description:
      'Could not start the sign in process. Please try again or use a different provider.',
  },
  OAuthCallback: {
    title: 'Callback Error',
    description:
      'There was an error during the authentication callback. Please try signing in again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Failed',
    description:
      'Could not create your account. You may already have an account with a different provider.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Failed',
    description:
      'Could not create your account using this email. Please try a different method.',
  },
  Callback: {
    title: 'Callback Error',
    description:
      'There was an error processing the authentication callback. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description:
      'This email is already associated with another account. Please sign in with the original provider.',
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    description:
      'An unexpected error occurred during authentication. Please try again.',
  },
}

export default function AuthErrorPage() {
  const router = useRouter()
  const [errorInfo, setErrorInfo] = useState(ERROR_MESSAGES.Default)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error) {
      setErrorCode(error)
      setErrorInfo(ERROR_MESSAGES[error] || ERROR_MESSAGES.Default)
    }
  }, [])

  const handleRetry = () => {
    router.push('/auth/login')
  }

  const handleGoBack = () => {
    router.push('/overview')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Background decoration - red tinted for error */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-destructive/5 via-transparent to-transparent blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-destructive/20 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          {/* Error icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="text-base">
              {errorInfo.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error code for debugging */}
          {errorCode && (
            <div className="rounded-lg border border-border/50 bg-muted/50 p-3 text-center">
              <span className="text-xs text-muted-foreground">
                Error code:{' '}
              </span>
              <code className="text-xs font-medium">{errorCode}</code>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button variant="outline" onClick={handleGoBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground">
            If this problem persists, please contact your administrator or check
            the server logs for more details.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
