'use client'

import { Trash2, X } from 'lucide-react'
import type { RowSelectionState, Table } from '@tanstack/react-table'

import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { killQuery } from '@/components/data-table/cells/actions/actions'
import { cn } from '@/lib/utils'

interface BulkActionsProps<TData> {
  table: Table<TData>
  bulkActions: string[]
  bulkActionKey: string
}

/**
 * BulkActions - Toolbar component for bulk operations on selected rows
 *
 * Shows action buttons when rows are selected, allowing users to
 * perform operations on multiple rows at once.
 */
export function BulkActions<TData>({
  table,
  bulkActions,
  bulkActionKey,
}: BulkActionsProps<TData>) {
  const [isLoading, setIsLoading] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) {
    return null
  }

  const handleKillQueries = async () => {
    setIsLoading(true)
    const toastId = toast.loading(`Killing ${selectedCount} queries...`)

    try {
      const results = await Promise.allSettled(
        selectedRows.map((row) => {
          const queryId = (row.original as Record<string, unknown>)[
            bulkActionKey
          ] as string
          return killQuery(queryId, new FormData())
        })
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (failed === 0) {
        toast.success(`Successfully killed ${succeeded} queries`, {
          id: toastId,
        })
      } else {
        toast.warning(`Killed ${succeeded} queries, ${failed} failed`, {
          id: toastId,
        })
      }

      // Clear selection after action
      table.resetRowSelection()
    } catch (error) {
      toast.error(`Failed to kill queries: ${error}`, { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSelection = () => {
    table.resetRowSelection()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5',
        'border border-border/50'
      )}
    >
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>

      {bulkActions.includes('kill-query') && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleKillQueries}
          disabled={isLoading}
          className="h-7 gap-1.5 text-xs"
        >
          <Trash2 className="size-3.5" />
          Kill {selectedCount > 1 ? 'Queries' : 'Query'}
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearSelection}
        className="h-7 gap-1 text-xs text-muted-foreground"
      >
        <X className="size-3.5" />
        Clear
      </Button>
    </div>
  )
}
