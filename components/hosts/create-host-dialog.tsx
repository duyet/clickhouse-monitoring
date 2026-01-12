"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/client"
import { useSession } from "@/lib/auth/client"
import { Loader2 } from "lucide-react"
import { Plus } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface CreateHostDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

interface Organization {
  id: string
  name: string
  slug: string
  userRole: string
}

export function CreateHostDialog({ children, onSuccess }: CreateHostDialogProps) {
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  const [name, setName] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("9000")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [database, setDatabase] = useState("default")
  const [customName, setCustomName] = useState("")
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { session } = useSession()

  const debouncedHost = useDebounce(host, 500)

  // Fetch user's organizations when dialog opens
  const fetchOrganizations = async () => {
    if (!session) return

    setIsLoadingOrgs(true)
    try {
      const response = await fetch("/api/organizations", {
        headers: {
          "Authorization": `Bearer ${session.sessionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        // Select first organization by default
        if (data.length > 0 && !selectedOrganizationId) {
          setSelectedOrganizationId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
    } finally {
      setIsLoadingOrgs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!selectedOrganizationId) {
      setError("Please select an organization")
      setIsLoading(false)
      return
    }

    if (!name.trim() || !host.trim() || !username.trim() || !password) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/hosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.sessionToken}`,
        },
        body: JSON.stringify({
          organizationId: selectedOrganizationId,
          name: name.trim(),
          host: host.trim(),
          port: Number(port),
          username: username.trim(),
          password,
          database: database.trim() || "default",
          customName: customName.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create host")
      }

      // Reset form
      setName("")
      setHost("")
      setPort("9000")
      setUsername("")
      setPassword("")
      setDatabase("default")
      setCustomName("")
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create host")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen && session) {
        fetchOrganizations()
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add ClickHouse Host</DialogTitle>
          <DialogDescription>
            Add a new ClickHouse host to monitor. Your credentials will be securely encrypted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            {isLoadingOrgs ? (
              <div className="h-10 bg-muted animate-pulse rounded" />
            ) : (
              <select
                id="organization"
                value={selectedOrganizationId}
                onChange={(e) => setSelectedOrganizationId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                disabled={isLoading}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.userRole})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Host Name</Label>
            <Input
              id="name"
              placeholder="Enter host name (e.g., Production DB)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host Address</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="9000"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="default"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              placeholder="default"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customName">Display Name (Optional)</Label>
            <Input
              id="customName"
              placeholder="Custom display name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Host
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}