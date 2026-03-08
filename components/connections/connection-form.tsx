'use client'

import { Check, Eye, EyeOff, Globe, Loader2, X } from 'lucide-react'

import type { BrowserConnection } from '@/lib/types/browser-connection'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type { BrowserConnection }

export type ConnectionFormData = Pick<
  BrowserConnection,
  'name' | 'host' | 'user' | 'password'
>

interface TestStatus {
  state: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

interface ConnectionFormProps {
  onSave: (data: ConnectionFormData) => void
  initialValues?: Partial<ConnectionFormData>
  onCancel: () => void
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isFormValid(data: ConnectionFormData): boolean {
  return (
    data.name.trim().length > 0 &&
    isValidUrl(data.host.trim()) &&
    data.user.trim().length > 0
  )
}

export function ConnectionForm({
  onSave,
  initialValues,
  onCancel,
}: ConnectionFormProps) {
  const [form, setForm] = useState<ConnectionFormData>({
    name: initialValues?.name ?? '',
    host: initialValues?.host ?? '',
    user: initialValues?.user ?? '',
    password: initialValues?.password ?? '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>({ state: 'idle' })

  const handleChange =
    (field: keyof ConnectionFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      // Reset test status when form changes
      if (testStatus.state !== 'idle') {
        setTestStatus({ state: 'idle' })
      }
    }

  const handleTest = async () => {
    setTestStatus({ state: 'loading' })
    try {
      const response = await fetch('/api/v1/browser-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: form.host.trim(),
          user: form.user.trim(),
          password: form.password,
        }),
      })
      const json = (await response.json()) as {
        success?: boolean
        version?: string
        error?: string
      }
      if (response.ok && json.success) {
        setTestStatus({
          state: 'success',
          message: json.version
            ? `Connected — ClickHouse ${json.version}`
            : 'Connected',
        })
      } else {
        setTestStatus({
          state: 'error',
          message: json.error ?? 'Connection failed',
        })
      }
    } catch (err) {
      setTestStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  const handleSave = () => {
    if (!isFormValid(form)) return
    onSave({
      name: form.name.trim(),
      host: form.host.trim(),
      user: form.user.trim(),
      password: form.password,
    })
  }

  const valid = isFormValid(form)

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="conn-name" className="text-sm font-medium">
          Name
        </Label>
        <Input
          id="conn-name"
          placeholder="My ClickHouse"
          value={form.name}
          onChange={handleChange('name')}
          autoComplete="off"
        />
      </div>

      {/* Host URL */}
      <div className="space-y-1.5">
        <Label htmlFor="conn-host" className="text-sm font-medium">
          Host URL
        </Label>
        <div className="relative">
          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="conn-host"
            placeholder="https://clickhouse.example.com:8123"
            value={form.host}
            onChange={handleChange('host')}
            className="pl-8"
            autoComplete="off"
            type="url"
          />
        </div>
        {form.host.length > 0 && !isValidUrl(form.host) && (
          <p className="text-xs text-destructive">
            Enter a valid HTTP or HTTPS URL
          </p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="conn-user" className="text-sm font-medium">
          Username
        </Label>
        <Input
          id="conn-user"
          placeholder="default"
          value={form.user}
          onChange={handleChange('user')}
          autoComplete="username"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="conn-password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Input
            id="conn-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            className="pr-9"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Test Connection */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={!valid || testStatus.state === 'loading'}
        >
          {testStatus.state === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : null}
          Test Connection
        </Button>

        {testStatus.state === 'success' && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            {testStatus.message}
          </span>
        )}
        {testStatus.state === 'error' && (
          <span className="flex items-center gap-1.5 text-xs text-destructive">
            <X className="h-3.5 w-3.5" />
            {testStatus.message}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={!valid}>
          Save
        </Button>
      </div>
    </div>
  )
}
