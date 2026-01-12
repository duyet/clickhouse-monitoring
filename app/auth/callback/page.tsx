'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession } from 'better-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const redirectTo = searchParams.get('redirectTo') || '/overview'

        // Get session to verify authentication
        const session = await getSession()

        if (session) {
          setStatus('success')
          // Redirect to the intended page after a short delay
          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
        } else {
          setStatus('error')
          setError('Authentication failed. Please try again.')
        }
      } catch (err) {
        setStatus('error')
        setError('An error occurred during authentication.')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Authenticating...
          </CardTitle>
          <CardDescription className="text-center">
            Please wait while we complete your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Authentication successful! Redirecting...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}