"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HostCard } from "@/components/hosts/host-card"
import { CreateHostDialog } from "@/components/hosts/create-host-dialog"
import { Search, Plus, Server, AlertCircle } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Host {
  id: string
  name: string
  host: string
  port: number
  username: string
  database?: string
  customName?: string
  isActive: boolean
  createdAt: string
  organizationName?: string
}

export default function HostsPage() {
  const { session } = useAuth()
  const [hosts, setHosts] = useState<Host[]>([])
  const [filteredHosts, setFilteredHosts] = useState<Host[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isTestingHost, setIsTestingHost] = useState<string | null>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (session) {
      fetchHosts()
    }
  }, [session])

  useEffect(() => {
    if (debouncedSearchTerm) {
      setFilteredHosts(
        hosts.filter(host =>
          host.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          host.host.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          host.customName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          host.organizationName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredHosts(hosts)
    }
  }, [hosts, debouncedSearchTerm])

  const fetchHosts = async () => {
    try {
      const response = await fetch("/api/hosts", {
        headers: {
          "Authorization": `Bearer ${session?.sessionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHosts(data)
        setFilteredHosts(data)
      }
    } catch (error) {
      console.error("Error fetching hosts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async (hostId: string) => {
    setIsTestingHost(hostId)
    try {
      const response = await fetch(`/api/hosts/${hostId}/test`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.sessionToken}`,
        },
      })

      if (response.ok) {
        // Show success message
        console.log("Connection test successful")
      } else {
        // Show error message
        console.error("Connection test failed")
      }
    } catch (error) {
      console.error("Error testing connection:", error)
    } finally {
      setIsTestingHost(null)
    }
  }

  const handleCreateSuccess = () => {
    fetchHosts()
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
            <h1 className="text-3xl font-bold tracking-tight">Hosts</h1>
            <p className="text-muted-foreground">
              Manage your ClickHouse hosts and connections
            </p>
          </div>
          <CreateHostDialog onSuccess={handleCreateSuccess}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Host
            </Button>
          </CreateHostDialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hosts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredHosts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hosts found</h3>
            <p className="text-muted-foreground mb-4">
              {hosts.length === 0
                ? "Add your first ClickHouse host to start monitoring."
                : "No hosts match your search."}
            </p>
            {hosts.length === 0 && (
              <CreateHostDialog onSuccess={handleCreateSuccess}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Host
                </Button>
              </CreateHostDialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHosts.map((host) => (
            <HostCard
              key={host.id}
              host={host}
              onTest={handleTestConnection}
              onEdit={(hostData) => {
                // TODO: Implement edit dialog
                console.log("Edit host:", hostData)
              }}
              onDelete={(hostId) => {
                // TODO: Implement delete confirmation
                console.log("Delete host:", hostId)
              }}
            />
          ))}
        </div>
      )}

      {/* Testing overlay */}
      {isTestingHost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Testing connection...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}