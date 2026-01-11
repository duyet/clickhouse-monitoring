'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, useAuthState } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Database, ExternalLink, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { HostForm } from '@/components/hosts/host-form'

export default function HostsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isLoading: sessionLoading } = useSession()
  const { isAuthenticated } = useAuthState()
  const [organizationId, setOrganizationId] = useState(searchParams.get('org') || '')
  const [hosts, setHosts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingHost, setEditingHost] = useState<any>(null)

  // Check authentication and get organization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (sessionLoading) return

    // Get first organization if none specified
    if (!organizationId) {
      fetchOrganizations()
    } else {
      fetchHosts()
    }
  }, [isAuthenticated, sessionLoading, organizationId, router])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        setOrganizationId(result.data[0].id)
        router.push(`/hosts?org=${result.data[0].id}`)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    }
  }

  const fetchHosts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/hosts?organizationId=${organizationId}`)
      const result = await response.json()
      if (result.success) {
        setHosts(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch hosts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading organizations...</p>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              setShowForm(false)
              setEditingHost(null)
            }}
          >
            ← Back
          </Button>
        </div>
        <HostForm
          organizationId={organizationId}
          onSuccess={() => {
            fetchHosts()
            setShowForm(false)
            setEditingHost(null)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingHost(null)
          }}
          editData={editingHost}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ClickHouse Hosts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your ClickHouse cluster connections
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Host
        </Button>
      </div>

      {/* Hosts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl">🗄️</div>
            <h2 className="text-2xl font-semibold">No hosts configured</h2>
            <p className="text-muted-foreground">
              Add your first ClickHouse host to start monitoring
            </p>
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Host
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosts.map((host) => (
            <Card key={host.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {host.name}
                  </span>
                  <Badge variant={host.isActive ? 'default' : 'secondary'}>
                    {host.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {host.description || 'No description'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Host:</span>
                    <span className="font-mono text-xs">
                      {host.host}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Port:</span>
                    <span>{host.port}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Protocol:</span>
                    <Badge variant="outline">{host.protocol}</Badge>
                  </div>
                  {host.connectionError && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">{host.connectionError}</span>
                    </div>
                  )}
                  {host.lastConnectedAt && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">
                        Last connected: {new Date(host.lastConnectedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingHost(host)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard?host=${host.id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}