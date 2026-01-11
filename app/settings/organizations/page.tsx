'use client'

import {
  Building2,
  Copy,
  Loader2,
  MoreVertical,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CreateOrgModal } from '@/components/organizations/create-org-modal'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type AuthSession,
  organization,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from '@/lib/auth/client'
import { cn } from '@/lib/utils'

/**
 * Member type
 */
interface Member {
  id: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/**
 * Invitation type
 */
interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
}

export default function OrganizationsSettingsPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession() as {
    data: AuthSession | null
    isPending: boolean
  }
  const { data: orgs, isPending: isOrgsLoading } = useListOrganizations()
  const { data: activeOrg } = useActiveOrganization()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      router.push('/auth/login?redirect=/settings/organizations')
    }
  }, [session, isSessionLoading, router])

  // Load members when org changes
  useEffect(() => {
    async function loadMembers() {
      if (!activeOrg?.id) return

      setIsLoadingMembers(true)
      try {
        // First set the active org context, then list members
        const membersResult = await organization.listMembers()
        // Handle response format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const membersList = Array.isArray((membersResult as any)?.data)
          ? (membersResult as any).data
          : []
        setMembers(membersList as Member[])
      } catch (error) {
        console.error('Failed to load members:', error)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    loadMembers()
  }, [activeOrg?.id])

  // Load invitations when org changes
  useEffect(() => {
    async function loadInvitations() {
      if (!activeOrg?.id) return

      try {
        const response = await fetch(
          `/api/v1/invitations?organizationId=${activeOrg.id}`
        )
        if (response.ok) {
          const data = (await response.json()) as { data?: Invitation[] }
          setInvitations(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load invitations:', error)
      }
    }

    loadInvitations()
  }, [activeOrg?.id])

  /**
   * Handle sending invitation
   */
  const handleInvite = useCallback(async () => {
    if (!activeOrg?.id || !inviteEmail) return

    setIsInviting(true)
    setInviteError(null)

    try {
      const response = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeOrg.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = (await response.json()) as {
        data?: Invitation
        error?: { message: string }
      }

      if (response.ok && data.data) {
        // Add to invitations list
        setInvitations((prev) => [...prev, data.data!])
        setInviteEmail('')
      } else {
        setInviteError(data.error?.message || 'Failed to send invitation')
      }
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : 'Failed to send invitation'
      )
    } finally {
      setIsInviting(false)
    }
  }, [activeOrg?.id, inviteEmail, inviteRole])

  /**
   * Copy invite link to clipboard
   */
  const handleCopyInviteLink = useCallback(
    async (invitation: Invitation & { inviteLink?: string }) => {
      const link =
        invitation.inviteLink ||
        `${window.location.origin}/auth/invite/${invitation.id}`

      try {
        await navigator.clipboard.writeText(link)
        setCopiedInviteId(invitation.id)
        setTimeout(() => setCopiedInviteId(null), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    },
    []
  )

  /**
   * Revoke invitation
   */
  const handleRevokeInvitation = useCallback(async (invitationId: string) => {
    try {
      const response = await fetch(`/api/v1/invitations?id=${invitationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      }
    } catch (error) {
      console.error('Failed to revoke invitation:', error)
    }
  }, [])

  /**
   * Remove member
   */
  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (!activeOrg?.id) return

      try {
        await organization.removeMember({
          organizationId: activeOrg.id,
          memberIdOrEmail: memberId,
        })
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
      } catch (error) {
        console.error('Failed to remove member:', error)
      }
    },
    [activeOrg?.id]
  )

  // Loading state
  if (isSessionLoading || isOrgsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session?.user) {
    return null
  }

  const currentOrg = activeOrg || orgs?.[0]

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organization Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your organizations and team members
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Organizations
          </CardTitle>
          <CardDescription>
            Organizations you own or are a member of
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!orgs || orgs.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No organizations yet
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first organization
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    org.id === currentOrg?.id && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {org.logo ? (
                        <Image
                          src={org.logo}
                          alt={org.name}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        /{org.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {org.id !== currentOrg?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          organization.setActive({ organizationId: org.id })
                        }
                      >
                        Switch
                      </Button>
                    )}
                    {org.id === currentOrg?.id && (
                      <span className="text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      {currentOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>Members of {currentOrg.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invite form */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">
                  Email address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Invite
              </Button>
            </div>

            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Pending Invitations
                </h4>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">{inv.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {inv.role} · Pending
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyInviteLink(
                            inv as Invitation & { inviteLink?: string }
                          )
                        }
                      >
                        {copiedInviteId === inv.id ? (
                          <span className="text-xs text-green-600">
                            Copied!
                          </span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvitation(inv.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Members list */}
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No team members yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Members
                </h4>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted overflow-hidden">
                        {member.user.image ? (
                          <Image
                            src={member.user.image}
                            alt={member.user.name || 'User'}
                            width={32}
                            height={32}
                          />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                          member.role === 'owner' &&
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                          member.role === 'admin' &&
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                          member.role === 'member' &&
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        )}
                      >
                        {member.role === 'owner' && (
                          <Shield className="h-3 w-3" />
                        )}
                        {member.role}
                      </span>

                      {member.role !== 'owner' &&
                        member.userId !== session.user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  organization.updateMemberRole({
                                    organizationId: currentOrg.id,
                                    memberId: member.id,
                                    role:
                                      member.role === 'admin'
                                        ? 'member'
                                        : 'admin',
                                  })
                                }
                              >
                                Change to{' '}
                                {member.role === 'admin' ? 'Member' : 'Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Org Modal */}
      <CreateOrgModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  )
}
