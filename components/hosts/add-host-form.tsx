'use client'

import { Eye, EyeOff, Loader2, Plus } from 'lucide-react'

import { SelfSignedWarning } from './self-signed-warning'
import { TestConnectionButton } from './test-connection-button'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActiveOrganization } from '@/lib/auth/client'

interface AddHostFormProps {
  /**
   * Callback after successful host creation
   */
  onSuccess?: (host: { id: string; name: string }) => void
  /**
   * Callback on form cancel
   */
  onCancel?: () => void
}

interface FormData {
  name: string
  host: string
  username: string
  password: string
}

interface FormErrors {
  name?: string
  host?: string
  username?: string
  password?: string
  general?: string
}

/**
 * Add Host Form Component
 *
 * Form for adding a new ClickHouse host with:
 * - Name, URL, Username, Password fields
 * - Password visibility toggle
 * - Optional connection test
 * - Self-signed certificate warning
 */
export function AddHostForm({ onSuccess, onCancel }: AddHostFormProps) {
  const router = useRouter()
  const { data: activeOrg } = useActiveOrganization()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    host: '',
    username: 'default',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSelfSignedWarning, setShowSelfSignedWarning] = useState(false)
  const [selfSignedConfirmed, setSelfSignedConfirmed] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<
    'success' | 'error' | 'self-signed' | null
  >(null)

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
      setConnectionTested(false)
      setConnectionTestResult(null)
    },
    []
  )

  /**
   * Validate form data
   */
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.host.trim()) {
      newErrors.host = 'Host URL is required'
    } else {
      try {
        new URL(formData.host)
      } catch {
        newErrors.host = 'Please enter a valid URL'
      }
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  /**
   * Handle connection test result
   */
  const handleTestResult = useCallback(
    (result: { success: boolean; error?: string; selfSigned?: boolean }) => {
      setConnectionTested(true)
      if (result.success) {
        setConnectionTestResult('success')
      } else if (result.selfSigned) {
        setConnectionTestResult('self-signed')
        setShowSelfSignedWarning(true)
      } else {
        setConnectionTestResult('error')
        setErrors((prev) => ({
          ...prev,
          general: result.error || 'Connection test failed',
        }))
      }
    },
    []
  )

  /**
   * Handle self-signed certificate confirmation
   */
  const handleSelfSignedConfirm = useCallback(() => {
    setSelfSignedConfirmed(true)
    setShowSelfSignedWarning(false)
    setConnectionTestResult('success')
  }, [])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      if (!activeOrg?.id) {
        setErrors({ general: 'Please select an organization first' })
        return
      }

      setIsSubmitting(true)

      try {
        const response = await fetch('/api/v1/hosts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: activeOrg.id,
            name: formData.name,
            host: formData.host,
            username: formData.username,
            password: formData.password,
            selfSignedConfirmed,
          }),
        })

        const data = (await response.json()) as {
          data?: { id: string; name: string }
          error?: { message: string }
        }

        if (response.ok && data.data) {
          onSuccess?.(data.data)
          router.push('/overview')
        } else {
          setErrors({
            general: data.error?.message || 'Failed to add host',
          })
        }
      } catch (error) {
        setErrors({
          general:
            error instanceof Error ? error.message : 'Failed to add host',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, activeOrg?.id, selfSignedConfirmed, validate, onSuccess, router]
  )

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="host-name">Name</Label>
          <Input
            id="host-name"
            placeholder="Production Cluster"
            value={formData.name}
            onChange={handleChange('name')}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Host URL field */}
        <div className="space-y-2">
          <Label htmlFor="host-url">Host URL</Label>
          <Input
            id="host-url"
            placeholder="https://clickhouse.example.com:8443"
            value={formData.host}
            onChange={handleChange('host')}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.host && (
            <p className="text-sm text-destructive">{errors.host}</p>
          )}
        </div>

        {/* Username field */}
        <div className="space-y-2">
          <Label htmlFor="host-username">Username</Label>
          <Input
            id="host-username"
            placeholder="default"
            value={formData.username}
            onChange={handleChange('username')}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username}</p>
          )}
        </div>

        {/* Password field with toggle visibility */}
        <div className="space-y-2">
          <Label htmlFor="host-password">Password</Label>
          <div className="relative">
            <Input
              id="host-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange('password')}
              disabled={isSubmitting}
              autoComplete="new-password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        {/* General error message */}
        {errors.general && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {errors.general}
          </div>
        )}

        {/* Connection test button (optional) */}
        <TestConnectionButton
          host={formData.host}
          username={formData.username}
          password={formData.password}
          onResult={handleTestResult}
          disabled={isSubmitting || !formData.host || !formData.username}
        />

        {/* Connection test result */}
        {connectionTested && connectionTestResult === 'success' && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
            Connection test successful!
          </div>
        )}

        {/* Form actions */}
        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={onCancel ? 'flex-1' : 'w-full'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Host...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Host
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Self-signed certificate warning modal */}
      <SelfSignedWarning
        open={showSelfSignedWarning}
        onOpenChange={setShowSelfSignedWarning}
        onConfirm={handleSelfSignedConfirm}
        hostUrl={formData.host}
      />
    </>
  )
}
