'use client'

import { DatabaseIcon } from 'lucide-react'

export function ExplorerEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <DatabaseIcon className="size-16 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Welcome to Data Explorer</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a database and table from the sidebar to view its data,
          structure, DDL, and indexes.
        </p>
      </div>
    </div>
  )
}
