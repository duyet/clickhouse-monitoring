'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Settings } from 'lucide-react'
import { CreateOrganizationDialog } from './create-organization-dialog'
import { OrganizationList } from './organization-list'
import { OrganizationSettingsDialog } from './organization-settings-dialog'

interface Organization {
  id: number
  name: string
  slug: string
  description?: string
  avatar?: string
  settings?: string
  createdAt: string
  updatedAt: string
}

export function OrganizationsContent() {
  const { user, isAuthenticated } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations()
    }
  }, [isAuthenticated])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/v1/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrg = async (orgData: { name: string; description?: string }) => {
    try {
      const response = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      })

      if (response.ok) {
        await fetchOrganizations()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
    }
  }

  const handleUpdateOrg = async (orgData: { name?: string; description?: string }) => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/v1/organizations/${selectedOrg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      })

      if (response.ok) {
        await fetchOrganizations()
        setShowSettingsDialog(false)
        setSelectedOrg(null)
      }
    } catch (error) {
      console.error('Failed to update organization:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view organizations</p>
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
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and team members
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first organization to get started with ClickHouse monitoring
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    {org.description && (
                      <CardDescription>{org.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrg(org)
                      setShowSettingsDialog(true)
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/hosts?org=${org.id}`}
                  >
                    View Hosts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateOrg}
      />

      <OrganizationSettingsDialog
        organization={selectedOrg}
        open={showSettingsDialog}
        onOpenChange={(open) => {
          setShowSettingsDialog(open)
          if (!open) setSelectedOrg(null)
        }}
        onUpdate={handleUpdateOrg}
      />
    </div>
  )
}