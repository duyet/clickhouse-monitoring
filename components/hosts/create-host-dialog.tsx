'use client'

import { useState } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle } from 'lucide-react'

const createHostSchema = z.object({
  name: z.string().min(2, 'Host name must be at least 2 characters'),
  host: z.string().min(1, 'Host address is required'),
  port: z.number().min(1).max(65535).default(9000),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  description: z.string().optional(),
})

type CreateHostFormData = z.infer<typeof createHostSchema>

interface CreateHostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: {
    name: string
    host: string
    port: number
    username?: string
    database?: string
    description?: string
  }) => void
}

export function CreateHostDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateHostDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateHostFormData>({
    resolver: zodResolver(createHostSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 9000,
      username: '',
      password: '',
      database: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateHostFormData) => {
    setIsSubmitting(true)

    try {
      await onCreate({
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username || undefined,
        database: data.database || undefined,
        description: data.description || undefined,
      })

      // Reset form
      form.reset({
        name: '',
        host: '',
        port: 9000,
        username: '',
        password: '',
        database: '',
        description: '',
      })
    } catch (error) {
      console.error('Failed to create host:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add ClickHouse Host</DialogTitle>
          <DialogDescription>
            Connect to your ClickHouse cluster to start monitoring.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Production Cluster"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this host.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="localhost"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="9000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="default"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your password will be encrypted and stored securely.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="default"
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Production environment cluster"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your ClickHouse credentials will be encrypted using AES-256-GCM
                and stored securely in your database.
              </AlertDescription>
            </Alert>

            {form.watch('host')?.endsWith('.internal') && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You're connecting to an internal host. Ensure proper network
                  security and consider using SSL/TLS encryption.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding Host...' : 'Add Host'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}