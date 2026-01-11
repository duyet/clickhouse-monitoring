'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreateOrganizationFormProps {
  onSuccess?: (org: any) => void
  onCancel?: () => void
}

export function CreateOrganizationForm({ onSuccess, onCancel }: CreateOrganizationFormProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createdOrg, setCreatedOrg] = useState<any>(null)

  const router = useRouter()
  const { toast } = useToast()

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  const copyToClipboard = async () => {
    if (createdOrg) {
      await navigator.clipboard.writeText(`${window.location.origin}/org/${createdOrg.slug}`)
      toast({ title: 'Link copied to clipboard' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization')
      }

      setCreatedOrg(result.data)

      if (onSuccess) {
        onSuccess(result.data)
      }

      toast({
        title: 'Organization created',
        description: `Organization "${name}" has been created successfully`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (createdOrg) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Organization Created! 🎉</CardTitle>
          <CardDescription>
            Your organization is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              {createdOrg.name}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {createdOrg.description}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              Organization URL: {window.location.origin}/org/{createdOrg.slug}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={copyToClipboard}
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Organization Link
            </Button>

            <Button
              className="w-full"
              onClick={() => router.push(`/settings/organizations/${createdOrg.slug}`)}
            >
              Go to Organization Settings
            </Button>
          </div>

          {onCancel && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
            >
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>
          Set up a new organization to manage your ClickHouse hosts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
              helpText="Only lowercase letters, numbers, and hyphens"
            />
            <p className="text-xs text-muted-foreground">
              Organization URL will be: {window.location.origin}/org/{slug || 'your-slug'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization..."
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}