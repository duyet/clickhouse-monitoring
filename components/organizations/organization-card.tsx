"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface OrganizationCardProps {
  organization: {
    id: string
    name: string
    description?: string
    slug: string
    userRole: string
    createdAt: string
  }
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const { name, description, slug, userRole, createdAt } = organization

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          <Badge variant={userRole === "owner" ? "default" : "secondary"}>
            {userRole}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Users className="mr-1 h-3 w-3" />
          Created {new Date(createdAt).toLocaleDateString()}
        </div>

        <div className="flex gap-2">
          <Link href={`/${slug}/overview`} className="flex-1">
            <Button variant="outline" className="w-full">
              Dashboard
            </Button>
          </Link>
          <Link href={`/${slug}/settings`} className="flex-1">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${slug}/overview`}>View Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${slug}/settings`}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${slug}/hosts`}>Manage Hosts</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}