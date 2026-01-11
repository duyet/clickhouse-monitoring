'use client'

import { Check, Copy, Link2, Loader2 } from 'lucide-react'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InviteLinkGeneratorProps {
  /**
   * Organization ID to generate link for
   */
  organizationId: string
  /**
   * Callback when invite is created
   */
  onInviteCreated?: (invitation: {
    id: string
    email: string
    role: string
    inviteLink: string
  }) => void
}

/**
 * Invite Link Generator Component
 *
 * Generates shareable invite links for organization invitations.
 * Supports email-based invites with role selection.
 */
export function InviteLinkGenerator({
  organizationId,
  onInviteCreated,
}: InviteLinkGeneratorProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /**
   * Generate invite link
   */
  const handleGenerate = useCallback(async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedLink(null)

    try {
      const response = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          email,
          role,
        }),
      })

      const data = (await response.json()) as {
        data?: {
          id: string
          email: string
          role: string
          inviteLink: string
        }
        error?: { message: string }
      }

      if (response.ok && data.data) {
        setGeneratedLink(data.data.inviteLink)
        onInviteCreated?.(data.data)
      } else {
        setError(data.error?.message || 'Failed to generate invite link')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate invite link'
      )
    } finally {
      setIsGenerating(false)
    }
  }, [organizationId, email, role, onInviteCreated])

  /**
   * Copy link to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [generatedLink])

  /**
   * Reset form
   */
  const handleReset = useCallback(() => {
    setEmail('')
    setRole('member')
    setGeneratedLink(null)
    setError(null)
  }, [])

  return (
    <div className="space-y-4">
      {!generatedLink ? (
        <>
          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as 'admin' | 'member')}
              disabled={isGenerating}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex flex-col items-start">
                    <span>Member</span>
                    <span className="text-xs text-muted-foreground">
                      Can view and execute queries
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Can manage hosts and invite members
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !email}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Generate Invite Link
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          {/* Generated link display */}
          <div className="space-y-2">
            <Label>Invite Link</Label>
            <div className="flex gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with {email} to invite them as a {role}. The link
              expires in 7 days.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Invite Another
            </Button>
            <Button onClick={handleCopy} className="flex-1">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
