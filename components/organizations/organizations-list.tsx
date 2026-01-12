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

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: Date
  memberCount?: number
  userRole?: string
}

interface OrganizationsListProps {
  organizations: Organization[]
  currentOrganization: Organization | null
  onSelect: (org: Organization) => void
}

export function OrganizationsList({
  organizations,
  currentOrganization,
  onSelect,
}: OrganizationsListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDescription, setNewOrgDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newOrgName,
          description: newOrgDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const newOrg = await response.json()
      organizations.push(newOrg)
      onSelect(newOrg)
      setIsCreateDialogOpen(false)
      setNewOrgName('')
      setNewOrgDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'member':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Owner'
      case 'admin':
        return 'Admin'
      case 'member':
        return 'Member'
      default:
        return role
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Icons.plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="My Company"
                  required
                />
              </div>
              <div>
                <Label htmlFor="org-description">Description (Optional)</Label>
                <Input
                  id="org-description"
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="ClickHouse monitoring for our infrastructure"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Organization
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {organizations.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No organizations found. Create your first organization to get
              started.
            </CardContent>
          </Card>
        ) : (
          organizations.map((org) => (
            <Card
              key={org.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                currentOrganization?.id === org.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSelect(org)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{org.name}</h3>
                      {org.userRole && (
                        <Badge variant={getRoleBadgeVariant(org.userRole)}>
                          {getRoleLabel(org.userRole)}
                        </Badge>
                      )}
                    </div>
                    {org.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {org.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {org.memberCount !== undefined && (
                        <span>{org.memberCount} members</span>
                      )}
                      <span>
                        Created {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <Icons.check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
