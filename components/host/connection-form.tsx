'use client'

import { CheckCircle2, Globe, Loader2, XCircle } from 'lucide-react'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ConnectionFormProps {
  initialValues?: {
    name?: string
    host?: string
    user?: string
    password?: string
  }
  onSubmit: (values: {
    name: string
    host: string
    user: string
    password: string
  }) => void
  onCancel?: () => void
  submitLabel?: string
  isSubmitting?: boolean
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

interface TestResult {
  status: TestStatus
  version?: string
  error?: string
}

export function ConnectionForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Connect',
  isSubmitting = false,
}: ConnectionFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [host, setHost] = useState(initialValues?.host ?? '')
  const [user, setUser] = useState(initialValues?.user ?? 'default')
  const [password, setPassword] = useState(initialValues?.password ?? '')
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle' })

  const isValidHost = host.startsWith('http://') || host.startsWith('https://')
  const canTest = host.length > 0 && isValidHost
  const canSubmit = testResult.status === 'success' && !isSubmitting

  // Reset test result when connection-relevant fields change
  const resetTest = useCallback(() => {
    setTestResult((prev) =>
      prev.status === 'idle' ? prev : { status: 'idle' }
    )
  }, [])

  const handleHostChange = (value: string) => {
    setHost(value)
    resetTest()
  }

  const handleUserChange = (value: string) => {
    setUser(value)
    resetTest()
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    resetTest()
  }

  const testConnection = async () => {
    if (!canTest) return

    setTestResult({ status: 'testing' })

    try {
      const response = await fetch('/api/v1/proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, user, password }),
      })

      const data = (await response.json()) as {
        success?: boolean
        version?: string
        error?: string
      }

      if (response.ok && data.success) {
        setTestResult({
          status: 'success',
          version: data.version,
        })
      } else {
        setTestResult({
          status: 'error',
          error: data.error || `Connection failed (${response.status})`,
        })
      }
    } catch (err) {
      setTestResult({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to test connection',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ name, host, user, password })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conn-name">Name</Label>
        <Input
          id="conn-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Auto-detected from host"
        />
      </div>

      {/* Host URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conn-host">
          Host URL <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Globe className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="conn-host"
            value={host}
            onChange={(e) => handleHostChange(e.target.value)}
            placeholder="https://my-clickhouse:8443"
            className="pl-8"
            required
            aria-invalid={host.length > 0 && !isValidHost}
          />
        </div>
        {host.length > 0 && !isValidHost && (
          <p className="text-destructive text-xs">
            URL must start with http:// or https://
          </p>
        )}
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conn-user">
          Username <span className="text-destructive">*</span>
        </Label>
        <Input
          id="conn-user"
          value={user}
          onChange={(e) => handleUserChange(e.target.value)}
          placeholder="default"
          required
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conn-password">Password</Label>
        <Input
          id="conn-password"
          type="password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {/* Test Connection */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={testConnection}
          disabled={!canTest || testResult.status === 'testing'}
          className="w-full"
        >
          {testResult.status === 'testing' ? (
            <>
              <Loader2 className="animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>

        {/* Test result */}
        {testResult.status === 'success' && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>
              Connected{testResult.version ? ` (v${testResult.version})` : ''}
            </span>
          </div>
        )}
        {testResult.status === 'error' && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
            <XCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{testResult.error}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className={cn(
          'flex gap-2 pt-2',
          onCancel ? 'justify-between' : 'justify-end'
        )}
      >
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              {submitLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
