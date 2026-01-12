'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Trash2, Users } from 'lucide-react'

const updateOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
})

type UpdateOrgFormData = z.infer<typeof updateOrgSchema>

interface OrganizationSettingsDialogProps {
  organization: {
    id: number
    name: string
    description?: string
    slug: string
    createdAt: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (data: { name?: string; description?: string }) => void
}

export function OrganizationSettingsDialog({
  organization,
  open,
  onOpenChange,
  onUpdate,
}: OrganizationSettingsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UpdateOrgFormData>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: organization?.name || '',
      description: organization?.description || '',
    },
  })

  // Reset form when organization changes
  React.useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        description: organization.description || '',
      })
    }
  }, [organization, form])

  const onSubmit = async (data: UpdateOrgFormData) => {
    setIsSubmitting(true)

    try {
      await onUpdate({
        name: data.name,
        description: data.description || undefined,
      })
    } catch (error) {
      console.error('Failed to update organization:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!organization) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Organization Settings</DialogTitle>
          <DialogDescription>
            Manage your organization's basic information and settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization ID</Label>
                <Input value={organization.id} disabled />
              </div>
              <div className="space-y-2">
                <Label>Organization Slug</Label>
                <Input value={organization.slug} disabled />
                <p className="text-xs text-muted-foreground">
                  Used for URLs and API identification
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={organization.name}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={organization.description || 'No description'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Organization Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(organization.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Team Members
              </h4>
              <p className="text-sm text-muted-foreground">
                Team member management coming soon. You will be able to invite users,
                assign roles, and manage permissions.
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}