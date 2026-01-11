'use client'

import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Server,
} from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AuthSession, useSession } from '@/lib/auth/client'
import { useAuthConfig } from '@/lib/auth/use-auth-config'
import { cn } from '@/lib/utils'

/**
 * Connection test result
 */
interface TestResult {
  success: boolean
  message: string
  version?: string
}

export default function AddHostPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession() as {
    data: AuthSession | null
    isPending: boolean
  }
  const { isAuthEnabled, isLoading: isAuthConfigLoading } = useAuthConfig()

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Connection test state
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  // Form values for test connection
  const [formValues, setFormValues] = useState({
    name: '',
    host: '',
    username: '',
    password: '',
  })

  // Redirect to login if auth is enabled but user not authenticated
  useEffect(() => {
    if (!isAuthConfigLoading && !isSessionLoading) {
      if (isAuthEnabled && !session?.user) {
        // Store intent to add host after login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_redirect', '/hosts/new')
        }
        router.push('/auth/login?redirect=/hosts/new')
      }
    }
  }, [isAuthEnabled, session, isAuthConfigLoading, isSessionLoading, router])

  /**
   * Test connection to ClickHouse host
   */
  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/v1/hosts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: formValues.host,
          username: formValues.username,
          password: formValues.password,
        }),
      })

      const data = (await response.json()) as {
        success?: boolean
        version?: string
        error?: string
      }

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Connection successful!',
          version: data.version,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      })
    } finally {
      setIsTesting(false)
    }
  }

  /**
   * Submit form to create new host
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to add host')
      }

      router.push('/overview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Update form value
   */
  const updateField = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    // Clear test result when connection details change
    if (['host', 'username', 'password'].includes(field)) {
      setTestResult(null)
    }
  }

  // Loading state while checking auth
  if (isAuthConfigLoading || isSessionLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if can test connection (all required fields filled)
  const canTestConnection =
    formValues.host && formValues.username && formValues.password

  return (
    <div className="container max-w-2xl py-8">
      <Card className="border-border/50">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Add ClickHouse Host</CardTitle>
              <CardDescription>
                Connect a new ClickHouse instance to monitor
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Production ClickHouse"
                value={formValues.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this host in the dashboard
              </p>
            </div>

            {/* Host URL */}
            <div className="space-y-2">
              <Label htmlFor="host">Host URL</Label>
              <Input
                id="host"
                name="host"
                placeholder="https://clickhouse.example.com:8443"
                value={formValues.host}
                onChange={(e) => updateField('host', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Full URL including protocol and port (e.g.,
                https://localhost:8443)
              </p>
            </div>

            {/* Credentials */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="default"
                  value={formValues.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formValues.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Test Connection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={!canTestConnection || isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Optional - verify credentials before saving
                </span>
              </div>

              {/* Test Result */}
              {testResult && (
                <Alert
                  className={cn(
                    'border',
                    testResult.success
                      ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20'
                      : 'border-destructive/30 bg-destructive/5'
                  )}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription
                    className={cn(
                      'text-sm',
                      testResult.success
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-destructive'
                    )}
                  >
                    {testResult.message}
                    {testResult.version && (
                      <span className="ml-2 text-muted-foreground">
                        (ClickHouse {testResult.version})
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Host'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
