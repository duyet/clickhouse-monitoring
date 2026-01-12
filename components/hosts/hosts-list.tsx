'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { useSWRConfig } from 'swr'

interface Host {
  id: string
  organizationId: string
  name: string
  host: string
  port?: number
  username?: string
  description?: string
  isActive: boolean
  createdAt: Date
  organization?: {
    id: string
    name: string
    slug: string
  }
}

interface HostsListProps {
  organizationId?: string
}

export function HostsList({ organizationId }: HostsListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [testDialogHost, setTestDialogHost] = useState<Host | null>(null)
  const [newHost, setNewHost] = useState({
    name: '',
    host: '',
    port: 9000,
    username: '',
    password: '',
    description: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate } = useSWRConfig()

  const { data: hosts = [], isLoading } = useSWR<Host[]>(
    organizationId ? `/api/hosts?organizationId=${organizationId}` : null,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch hosts')
      return response.json()
    }
  )

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...newHost,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create host')
      }

      const newHostData = await response.json()
      hosts.push(newHostData)
      mutate('/api/hosts')
      setIsCreateDialogOpen(false)
      setNewHost({
        name: '',
        host: '',
        port: 9000,
        username: '',
        password: '',
        description: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleTestHost = async (host: Host) => {
    setIsTesting(true)
    setError(null)

    try {
      const response = await fetch(`/api/hosts/${host.id}/test`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        alert('Connection successful!')
      } else {
        alert(`Connection failed: ${result.error}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      alert(`Connection failed: ${error}`)
    } finally {
      setIsTesting(false)
      setTestDialogHost(null)
    }
  }

  const handleDeleteHost = async (hostId: string) => {
    if (!confirm('Are you sure you want to delete this host?')) return

    try {
      const response = await fetch(`/api/hosts/${hostId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete host')
      }

      mutate('/api/hosts')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete host')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ClickHouse Hosts</h1>
          <p className="text-muted-foreground">
            Manage your ClickHouse cluster connections
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icons.plus className="mr-2 h-4 w-4" />
              Add Host
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Host</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateHost} className="space-y-4">
              <div>
                <Label htmlFor="host-name">Name</Label>
                <Input
                  id="host-name"
                  value={newHost.name}
                  onChange={(e) =>
                    setNewHost({ ...newHost, name: e.target.value })
                  }
                  placeholder="Production Cluster"
                  required
                />
              </div>
              <div>
                <Label htmlFor="host-host">Host</Label>
                <Input
                  id="host-host"
                  value={newHost.host}
                  onChange={(e) =>
                    setNewHost({ ...newHost, host: e.target.value })
                  }
                  placeholder="localhost"
                  required
                />
              </div>
              <div>
                <Label htmlFor="host-port">Port</Label>
                <Input
                  id="host-port"
                  type="number"
                  value={newHost.port}
                  onChange={(e) =>
                    setNewHost({ ...newHost, port: parseInt(e.target.value) })
                  }
                  placeholder="9000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="host-username">Username (Optional)</Label>
                <Input
                  id="host-username"
                  value={newHost.username}
                  onChange={(e) =>
                    setNewHost({ ...newHost, username: e.target.value })
                  }
                  placeholder="default"
                />
              </div>
              <div>
                <Label htmlFor="host-password">Password (Optional)</Label>
                <Input
                  id="host-password"
                  type="password"
                  value={newHost.password}
                  onChange={(e) =>
                    setNewHost({ ...newHost, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="host-description">Description (Optional)</Label>
                <Input
                  id="host-description"
                  value={newHost.description}
                  onChange={(e) =>
                    setNewHost({ ...newHost, description: e.target.value })
                  }
                  placeholder="Main production cluster"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Host
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {hosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Icons.database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hosts configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first ClickHouse host to start monitoring your clusters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hosts.map((host) => (
            <Card key={host.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{host.name}</CardTitle>
                  <Badge variant={host.isActive ? 'default' : 'secondary'}>
                    {host.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Connection</p>
                  <p className="text-sm text-muted-foreground">
                    {host.host}:{host.port || 9000}
                  </p>
                </div>
                {host.username && (
                  <div>
                    <p className="text-sm font-medium">Username</p>
                    <p className="text-sm text-muted-foreground">
                      {host.username}
                    </p>
                  </div>
                )}
                {host.description && (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {host.description}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTestDialogHost(host)}
                  >
                    <Icons.shield className="mr-1 h-4 w-4" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteHost(host.id)}
                  >
                    <Icons.trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {testDialogHost && (
        <Dialog
          open={!!testDialogHost}
          onOpenChange={() => setTestDialogHost(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Connection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Testing connection to {testDialogHost.name} (
                {testDialogHost.host}:{testDialogHost.port || 9000})
              </p>
              <Button
                onClick={() => handleTestHost(testDialogHost)}
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Test Connection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
