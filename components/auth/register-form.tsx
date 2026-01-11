'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, useAuthState } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { handleAuthError } from '@/lib/auth/client'

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuthState()

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signUp.email({
        email,
        password,
        name,
      })

      // Redirect to login or success
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/login?message=registration-success')
      }
    } catch (err) {
      setError(handleAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up to start monitoring your ClickHouse clusters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              minLength={8}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* OAuth providers */}
        {import.meta.env.GITHUB_CLIENT_ID && (
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={async () => {
                try {
                  await signIn.social({
                    provider: 'github',
                  })
                } catch (err) {
                  setError(handleAuthError(err))
                }
              }}
            >
              Continue with GitHub
            </Button>
          </div>
        )}

        {import.meta.env.GOOGLE_CLIENT_ID && (
          <div className="mt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  await signIn.social({
                    provider: 'google',
                  })
                } catch (err) {
                  setError(handleAuthError(err))
                }
              }}
            >
              Continue with Google
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}