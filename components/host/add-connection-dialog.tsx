'use client'

import type { CustomHost } from '@/lib/types/custom-hosts'

import { ConnectionForm } from './connection-form'
import { useCallback, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCustomHosts } from '@/lib/hooks/use-custom-hosts'

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onHostAdded?: (host: CustomHost) => void
}

export function AddConnectionDialog({
  open,
  onOpenChange,
  onHostAdded,
}: AddConnectionDialogProps) {
  const { addHost } = useCustomHosts()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    (values: {
      name: string
      host: string
      user: string
      password: string
    }) => {
      setIsSubmitting(true)
      try {
        const newHost = addHost(values)
        onHostAdded?.(newHost)
        onOpenChange(false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [addHost, onHostAdded, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
          <DialogDescription>
            Connect to a ClickHouse instance by providing its URL and
            credentials.
          </DialogDescription>
        </DialogHeader>
        <ConnectionForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel="Add Connection"
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
