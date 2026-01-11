'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Settings, Users, ArrowRight, Loader2 } from 'lucide-react'
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form'

export default function OrganizationsPage() {
  const router = useRouter()
  const { data: session, isLoading } = useSession()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/auth/login')
      return
    }

    // Fetch organizations
    if (session?.user) {
      fetchOrganizations()
    }
  }, [session, isLoading, router])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      const result = await response.json()
      if (result.success) {
        setOrganizations(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowCreateForm(false)}
          >
            ← Back
          </Button>
        </div>
        <CreateOrganizationForm
          onSuccess={() => {
            fetchOrganizations()
            setShowCreateForm(false)
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your ClickHouse monitoring teams
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl">🏠</div>
            <h2 className="text-2xl font-semibold">No organizations yet</h2>
            <p className="text-muted-foreground">
              Create your first organization to start managing ClickHouse hosts and teams
            </p>
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Organization
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{org.name}</span>
                  <span className="text-xs font-normal px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                    {org.role}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {org.description}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/settings/organizations/${org.slug}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard?org=${org.slug}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  <div>Slug: {org.slug}</div>
                  <div>Created: {new Date(org.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}