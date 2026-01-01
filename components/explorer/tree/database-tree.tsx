'use client'

import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { useTreeState } from '../hooks/use-tree-state'
import { DatabaseNode } from './database-node'
import { TreeSearch } from './tree-search'
import { TreeSkeleton } from './tree-skeleton'
import { useState } from 'react'
import { SidebarMenu } from '@/components/ui/sidebar'

interface Database {
  name: string
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

interface DatabaseTreeProps {
  hostId: number
}

const fetcher = (url: string): Promise<ApiResponse<Database[]>> =>
  fetch(url).then((res) => res.json())

export function DatabaseTree({ hostId }: DatabaseTreeProps) {
  const [searchFilter, setSearchFilter] = useState('')
  const { database, table, setDatabase, setDatabaseAndTable } =
    useExplorerState()
  const { isDatabaseExpanded, isTableExpanded, toggleDatabase, toggleTable } =
    useTreeState(database, table)

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse<Database[]>>(
    `/api/v1/explorer/databases?hostId=${hostId}`,
    fetcher
  )

  const databases = response?.data

  const handleSelectDatabase = (db: string) => {
    setDatabase(db)
  }

  const handleSelectTable = (db: string, tbl: string) => {
    setDatabaseAndTable(db, tbl)
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load databases: {error.message}
      </div>
    )
  }

  if (isLoading) {
    return <TreeSkeleton />
  }

  if (!databases || databases.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No databases found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <TreeSearch value={searchFilter} onChange={setSearchFilter} />
      <SidebarMenu>
        {databases.map((db) => (
          <DatabaseNode
            key={db.name}
            hostId={hostId}
            database={db.name}
            isExpanded={isDatabaseExpanded(db.name)}
            isTableExpanded={isTableExpanded}
            selectedTable={table}
            selectedDatabase={database}
            level={0}
            searchFilter={searchFilter}
            onToggle={() => toggleDatabase(db.name)}
            onToggleTable={toggleTable}
            onSelectDatabase={() => handleSelectDatabase(db.name)}
            onSelectTable={(tbl) => handleSelectTable(db.name, tbl)}
          />
        ))}
      </SidebarMenu>
    </div>
  )
}
