"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrganizationCard } from "@/components/organizations/organization-card"
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog"
import { Search, Plus, Building2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Organization {
  id: string
  name: string
  description?: string
  slug: string
  userRole: string
  createdAt: string
}

export default function OrganizationsPage() {
  const { session } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (session) {
      fetchOrganizations()
    }
  }, [session])

  useEffect(() => {
    if (debouncedSearchTerm) {
      setFilteredOrganizations(
        organizations.filter(org =>
          org.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          org.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredOrganizations(organizations)
    }
  }, [organizations, debouncedSearchTerm])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations", {
        headers: {
          "Authorization": `Bearer ${session?.sessionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        setFilteredOrganizations(data)
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    fetchOrganizations()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground">
              Manage your organizations and ClickHouse clusters
            </p>
          </div>
          <CreateOrganizationDialog onSuccess={handleCreateSuccess}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CreateOrganizationDialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredOrganizations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations found</h3>
            <p className="text-muted-foreground mb-4">
              {organizations.length === 0
                ? "Create your first organization to get started."
                : "No organizations match your search."}
            </p>
            {organizations.length === 0 && (
              <CreateOrganizationDialog onSuccess={handleCreateSuccess}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Organization
                </Button>
              </CreateOrganizationDialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </div>
      )}
    </div>
  )
}