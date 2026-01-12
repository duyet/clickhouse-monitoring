"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Server, Play, CheckCircle, XCircle, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/client"
import { usePermissions } from "@/lib/auth/client"

interface HostCardProps {
  host: {
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
  onEdit?: (host: any) => void
  onDelete?: (hostId: string) => void
  onTest?: (hostId: string) => void
}

export function HostCard({ host, onEdit, onDelete, onTest }: HostCardProps) {
  const [isTesting, setIsTesting] = useState(false)
  const { session } = useAuth()
  const { hasPermission } = usePermissions()

  const {
    id,
    name,
    host: hostAddress,
    port,
    username,
    database = "default",
    customName,
    isActive,
    createdAt,
    organizationName,
  } = host

  const displayName = customName || name
  const canManage = hasPermission("hosts:write")

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      await onTest?.(id)
    } finally {
      setIsTesting(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${displayName}"?`)) {
      await onDelete?.(id)
    }
  }

  return (
    <Card className={`h-full ${!isActive ? "opacity-60" : ""} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-4 w-4" />
                {displayName}
              </CardTitle>
              {isActive ? (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
            {organizationName && (
              <CardDescription className="text-xs">
                {organizationName}
              </CardDescription>
            )}
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTestConnection()}>
                  {isTesting ? (
                    <>
                      <Play className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(host)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Address:</span>
            <span className="ml-2 font-mono">
              {hostAddress}:{port}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Database:</span>
            <span className="ml-2 font-mono">{database}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Username:</span>
            <span className="ml-2">{username}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Created {new Date(createdAt).toLocaleDateString()}
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection()}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <Play className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Test
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}