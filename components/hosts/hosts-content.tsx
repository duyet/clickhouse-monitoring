'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Server, Database, Wifi, WifiOff, AlertTriangle, Trash2 } from 'lucide-react'
import { CreateHostDialog } from './create-host-dialog'
import { HostList } from './host-list'
import { TestConnectionDialog } from './test-connection-dialog'

interface Host {
  id: number
  organizationId: number
  name: string
  host: string
  port: number
  username?: string
  database?: string
  description?: string
  isActive: boolean
  lastConnectedAt?: string
  createdAt: string
  updatedAt: string
}

export function HostsContent() {
  const { user, isAuthenticated } = useAuth()
  const [hosts, setHosts] = useState<Host[]>([])
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchHosts()
    }
  }, [isAuthenticated])

  const fetchHosts = async () => {
    try {
      const response = await fetch('/api/v1/hosts')
      if (response.ok) {
        const data = await response.json()
        setHosts(data.hosts || [])
      }
    } catch (error) {
      console.error('Failed to fetch hosts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateHost = async (hostData: {
    name: string
    host: string
    port: number
    username?: string
    database?: string
    description?: string
  }) => {
    try {
      const response = await fetch('/api/v1/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hostData),
      })

      if (response.ok) {
        await fetchHosts()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Failed to create host:', error)
    }
  }

  const handleTestConnection = async (hostId: number) => {
    try {
      const response = await fetch(`/api/v1/hosts/${hostId}/test`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        // Show test results
        alert(`Connection test: ${result.status}\nResponse time: ${result.responseTime}ms`)
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
    }
  }

  const handleDeleteHost = async (hostId: number) => {
    if (!confirm('Are you sure you want to delete this host? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/hosts/${hostId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchHosts()
      }
    } catch (error) {
      console.error('Failed to delete host:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view hosts</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ClickHouse Hosts</h1>
          <p className="text-muted-foreground">
            Manage your ClickHouse cluster connections
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Host
        </Button>
      </div>

      {/* Onboarding Banner */}
      {hosts.length === 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Get started with ClickHouse monitoring
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Add your first ClickHouse host to start monitoring your cluster's performance,
                  queries, and system metrics.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Host
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hosts.map((host) => (
            <Card key={host.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center">
                      <Server className="mr-2 h-5 w-5" />
                      {host.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {host.host}:{host.port}
                    </CardDescription>
                  </div>
                  <Badge variant={host.isActive ? 'default' : 'secondary'}>
                    {host.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {host.description && (
                  <p className="text-sm text-muted-foreground">{host.description}</p>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  {host.isActive ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-muted-foreground">
                    {host.isActive ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {host.lastConnectedAt && (
                  <div className="text-xs text-muted-foreground">
                    Last connected: {new Date(host.lastConnectedAt).toLocaleString()}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedHost(host)
                      setShowTestDialog(true)
                    }}
                  >
                    Test Connection
                  </Button>
                  <div className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/overview?host=${host.id}`}
                    >
                      Overview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHost(host.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hosts configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your ClickHouse host to start monitoring your cluster
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Host
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateHostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateHost}
      />

      <TestConnectionDialog
        host={selectedHost}
        open={showTestDialog}
        onOpenChange={(open) => {
          setShowTestDialog(open)
          if (!open) setSelectedHost(null)
        }}
        onTest={handleTestConnection}
      />
    </div>
  )
}