'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TestTube2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { decryptHostCredentials } from '@/lib/encryption'

interface HostFormProps {
  organizationId: string
  onSuccess?: () => void
  onCancel?: () => void
  editData?: any
}

export function HostForm({ organizationId, onSuccess, onCancel, editData }: HostFormProps) {
  const [name, setName] = useState(editData?.name || '')
  const [description, setDescription] = useState(editData?.description || '')
  const [host, setHost] = useState(editData ? (editData.host || '') : '')
  const [port, setPort] = useState<string>(editData?.port?.toString() || '9000')
  const [username, setUsername] = useState(editData ? (editData.username || '') : 'default')
  const [password, setPassword] = useState('')
  const [protocol, setProtocol] = useState<'http' | 'https'>(editData?.protocol || 'http')
  const [secure, setSecure] = useState(!!editData?.secure)
  const [skipVerify, setSkipVerify] = useState(!!editData?.skipVerify)
  const [testConnection, setTestConnection] = useState(true)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const { toast } = useToast()

  const handleTestConnection = async () => {
    setIsTesting(true)
    setError('')

    try {
      const response = await fetch('/api/hosts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: parseInt(port),
          username,
          password: password || (editData ? '[UNCHANGED]' : ''),
          protocol,
          secure,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Connection failed')
      }

      setSuccess('Connection successful!')
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to ClickHouse',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/hosts', {
        method: editData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: editData
          ? JSON.stringify({
              id: editData.id,
              name,
              description,
              host,
              port: parseInt(port),
              username,
              password: password || '[UNCHANGED]',
              protocol,
              secure,
              skipVerify,
              testConnection,
            })
          : JSON.stringify({
              organizationId,
              name,
              description,
              host,
              port: parseInt(port),
              username,
              password,
              protocol,
              secure,
              skipVerify,
              testConnection,
            }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save host')
      }

      toast({
        title: editData ? 'Host Updated' : 'Host Added',
        description: `Host "${name}" has been ${editData ? 'updated' : 'added'} successfully`,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{editData ? 'Edit Host' : 'Add ClickHouse Host'}</CardTitle>
        <CardDescription>
          Configure connection details for your ClickHouse instance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Production Cluster"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  required
                  placeholder="9000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Primary production cluster..."
                rows={2}
              />
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Connection Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="host">Host Address</Label>
                <Input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                  placeholder="clickhouse.example.com or 192.168.1.100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="default"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editData && '(leave blank to keep current)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editData}
                  placeholder={editData ? '••••••••' : 'Enter password'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol</Label>
                <select
                  id="protocol"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as 'http' | 'https')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="secure"
                    checked={secure}
                    onCheckedChange={(checked) => setSecure(!!checked)}
                  />
                  <Label htmlFor="secure">Secure</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skipVerify"
                    checked={skipVerify}
                    onCheckedChange={(checked) => setSkipVerify(!!checked)}
                  />
                  <Label htmlFor="skipVerify">Skip SSL Verify</Label>
                </div>
              </div>
            </div>

            {secure && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Secure connections use SSL/TLS. For self-signed certificates, enable "Skip SSL Verify".
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Connection Testing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">Connection Testing</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="testConnection"
                  checked={testConnection}
                  onCheckedChange={(checked) => setTestConnection(!!checked)}
                />
                <Label htmlFor="testConnection" className="text-sm">
                  Test before saving
                </Label>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleTestConnection}
              disabled={isTesting || !host || !username || (!password && !editData)}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube2 className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>

            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editData ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editData ? 'Update Host' : 'Add Host'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}