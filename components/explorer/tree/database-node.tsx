'use client'

import { DatabaseIcon } from 'lucide-react'
import useSWR from 'swr'

import { TableNode } from './table-node'
import { TreeNode } from './tree-node'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface Table {
  name: string
  engine: string
  total_rows: number
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

interface DatabaseNodeProps {
  hostId: number
  database: string
  isExpanded: boolean
  isTableExpanded: (key: string) => boolean
  selectedTable: string | null
  selectedDatabase: string | null
  level: number
  searchFilter: string
  onToggleDatabase: (database: string) => void
  onToggleTable: (key: string) => void
  onSelectDatabase: (database: string) => void
  onSelectTable: (database: string, table: string, engine: string) => void
}

const fetcher = (url: string): Promise<ApiResponse<Table[]>> =>
  fetch(url).then((res) => res.json())

export const DatabaseNode = memo(function DatabaseNode({
  hostId,
  database,
  isExpanded,
  isTableExpanded,
  selectedTable,
  selectedDatabase,
  level,
  searchFilter,
  onToggleDatabase,
  onToggleTable,
  onSelectDatabase,
  onSelectTable,
}: DatabaseNodeProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  // Auto-trigger fetch when expanded (including from URL state)
  useEffect(() => {
    if (isExpanded && !shouldFetch) {
      setShouldFetch(true)
    }
  }, [isExpanded, shouldFetch])

  const { data: response, isLoading } = useSWR<ApiResponse<Table[]>>(
    shouldFetch
      ? `/api/v1/explorer/tables?hostId=${hostId}&database=${encodeURIComponent(database)}`
      : null,
    fetcher
  )

  const tables = response?.data

  const filteredTables = useMemo(() => {
    if (!tables) return []
    if (!searchFilter) return tables

    const lowerFilter = searchFilter.toLowerCase()
    return tables.filter((table) =>
      table.name.toLowerCase().includes(lowerFilter)
    )
  }, [tables, searchFilter])

  const handleToggle = useCallback(() => {
    if (!shouldFetch) {
      setShouldFetch(true)
    }
    onToggleDatabase(database)
  }, [shouldFetch, onToggleDatabase, database])

  const handleSelect = useCallback(() => {
    onSelectDatabase(database)
  }, [onSelectDatabase, database])

  const handleSelectTable = useCallback(
    (tbl: string, engine: string) => {
      onSelectTable(database, tbl, engine)
    },
    [onSelectTable, database]
  )

  const showLoadingSkeleton = isLoading && isExpanded && !tables

  // Only highlight if this database is selected and no table is selected
  const isHighlighted = selectedDatabase === database && !selectedTable

  return (
    <TreeNode
      label={database}
      icon={DatabaseIcon}
      isExpanded={isExpanded}
      isSelected={selectedDatabase === database && !selectedTable}
      isHighlighted={isHighlighted}
      isLoading={isLoading && isExpanded}
      hasChildren
      level={level}
      onToggle={handleToggle}
      onSelect={handleSelect}
    >
      {showLoadingSkeleton ? (
        <div
          className="space-y-1 py-1"
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-[80%]" />
          ))}
        </div>
      ) : (
        filteredTables.map((table) => {
          const tableKey = `${database}.${table.name}`
          return (
            <TableNode
              key={tableKey}
              hostId={hostId}
              database={database}
              table={table.name}
              engine={table.engine}
              totalRows={table.total_rows}
              isExpanded={isTableExpanded(tableKey)}
              isSelected={
                selectedDatabase === database && selectedTable === table.name
              }
              level={level + 1}
              onToggle={() => onToggleTable(tableKey)}
              onSelect={() => handleSelectTable(table.name, table.engine)}
            />
          )
        })
      )}
    </TreeNode>
  )
})
