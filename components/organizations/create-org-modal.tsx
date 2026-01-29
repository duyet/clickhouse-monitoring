'use client'

import { Building2, Loader2 } from 'lucide-react'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { organization } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

interface CreateOrgModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean
  /**
   * Callback when modal state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Callback when organization is created successfully
   */
  onCreated?: (org: { id: string; name: string; slug: string }) => void
}

/**
 * Create Organization Modal
 *
 * Allows users to create a new organization with a custom name and slug.
 * Validates slug format and checks for uniqueness.
 */
export function CreateOrgModal({
  open,
  onOpenChange,
  onCreated,
}: CreateOrgModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)

  /**
   * Generate slug from name
   */
  const generateSlug = useCallback((input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32)
  }, [])

  /**
   * Handle name change - auto-generate slug if user hasn't manually edited it
   */
  const handleNameChange = useCallback(
    (value: string) => {
      setName(value)
      // Auto-generate slug from name (only if slug matches auto-generated version)
      const currentAutoSlug = generateSlug(name)
      if (slug === '' || slug === currentAutoSlug) {
        setSlug(generateSlug(value))
      }
    },
    [name, slug, generateSlug]
  )

  /**
   * Validate slug format
   */
  const validateSlug = useCallback((value: string): boolean => {
    if (!value) {
      setSlugError('Slug is required')
      return false
    }
    if (value.length < 3) {
      setSlugError('Slug must be at least 3 characters')
      return false
    }
    if (value.length > 32) {
      setSlugError('Slug must be 32 characters or less')
      return false
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 2) {
      setSlugError(
        'Slug must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens'
      )
      return false
    }
    if (/^[a-z0-9]$/.test(value) || /^[a-z0-9][a-z0-9]$/.test(value)) {
      // Allow 1-2 char slugs that are just alphanumeric
      setSlugError(null)
      return true
    }
    setSlugError(null)
    return true
  }, [])

  /**
   * Handle slug change with validation
   */
  const handleSlugChange = useCallback(
    (value: string) => {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
      setSlug(sanitized)
      validateSlug(sanitized)
    },
    [validateSlug]
  )

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!validateSlug(slug)) {
        return
      }

      setIsSubmitting(true)

      try {
        const result = await organization.create({
          name,
          slug,
        })

        if (result.error) {
          setError(result.error.message || 'Failed to create organization')
          return
        }

        if (result.data) {
          // Set as active organization
          await organization.setActive({ organizationId: result.data.id })

          onCreated?.(result.data)
          onOpenChange(false)

          // Reset form
          setName('')
          setSlug('')
        }
      } catch (err) {
        console.error('Failed to create organization:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to create organization'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, slug, validateSlug, onCreated, onOpenChange]
  )

  /**
   * Handle modal close - reset form
   */
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setName('')
        setSlug('')
        setError(null)
        setSlugError(null)
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Create Organization</DialogTitle>
          <DialogDescription className="text-center">
            Create a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">Organization Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="org-slug"
                placeholder="acme-inc"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isSubmitting}
                className={cn(slugError && 'border-destructive')}
                required
              />
            </div>
            {slugError && (
              <p className="text-xs text-destructive">{slugError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be used in URLs: /overview?org={slug || 'your-slug'}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !slug}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
