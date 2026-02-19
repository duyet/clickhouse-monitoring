'use client'

import { Pencil, Trash2 } from 'lucide-react'

import type { CustomHost } from '@/lib/types/custom-hosts'

import { ConnectionForm } from './connection-form'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCustomHosts } from '@/lib/hooks/use-custom-hosts'

interface ManageConnectionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageConnectionsDialog({
  open,
  onOpenChange,
}: ManageConnectionsDialogProps) {
  const { hosts, updateHost, removeHost } = useCustomHosts()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleEdit = useCallback(
    (values: {
      name: string
      host: string
      user: string
      password: string
    }) => {
      if (!editingId) return
      updateHost(editingId, values)
      setEditingId(null)
    },
    [editingId, updateHost]
  )

  const handleDelete = useCallback(
    (id: string) => {
      removeHost(id)
      setConfirmDeleteId(null)
    },
    [removeHost]
  )

  const editingHost = editingId ? hosts.find((h) => h.id === editingId) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Connections</DialogTitle>
          <DialogDescription>
            Edit or remove saved ClickHouse connections.
          </DialogDescription>
        </DialogHeader>

        {editingHost ? (
          <EditView
            host={editingHost}
            onSubmit={handleEdit}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <ListView
            hosts={hosts}
            confirmDeleteId={confirmDeleteId}
            onEdit={setEditingId}
            onConfirmDelete={setConfirmDeleteId}
            onDelete={handleDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditView({
  host,
  onSubmit,
  onCancel,
}: {
  host: CustomHost
  onSubmit: (values: {
    name: string
    host: string
    user: string
    password: string
  }) => void
  onCancel: () => void
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-3 text-sm">
        Editing: {host.name || host.host}
      </p>
      <ConnectionForm
        initialValues={host}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel="Save Changes"
      />
    </div>
  )
}

function ListView({
  hosts,
  confirmDeleteId,
  onEdit,
  onConfirmDelete,
  onDelete,
}: {
  hosts: CustomHost[]
  confirmDeleteId: string | null
  onEdit: (id: string) => void
  onConfirmDelete: (id: string | null) => void
  onDelete: (id: string) => void
}) {
  if (hosts.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No custom connections yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {hosts.map((host) => (
        <HostRow
          key={host.id}
          host={host}
          isConfirmingDelete={confirmDeleteId === host.id}
          onEdit={() => onEdit(host.id)}
          onRequestDelete={() => onConfirmDelete(host.id)}
          onCancelDelete={() => onConfirmDelete(null)}
          onConfirmDelete={() => onDelete(host.id)}
        />
      ))}
    </div>
  )
}

function HostRow({
  host,
  isConfirmingDelete,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  host: CustomHost
  isConfirmingDelete: boolean
  onEdit: () => void
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  if (isConfirmingDelete) {
    return (
      <div className="flex items-center justify-between rounded-md border border-red-200 px-3 py-2 dark:border-red-800/50">
        <span className="text-sm">
          Delete <strong>{host.name || host.host}</strong>?
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onCancelDelete}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirmDelete}>
            Delete
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{host.name || host.host}</p>
        {host.name && (
          <p className="text-muted-foreground truncate text-xs">{host.host}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <Pencil className="size-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-red-500 hover:text-red-600"
          onClick={onRequestDelete}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  )
}
