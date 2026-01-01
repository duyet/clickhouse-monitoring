'use client'

import { DatabaseIcon } from 'lucide-react'
import useSWR from 'swr'

import { TableNode } from './table-node'
import { TreeNode } from './tree-node'
import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface Table {
  name: string
  readable_rows: string
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
  onToggle: () => void
  onToggleTable: (key: string) => void
  onSelectDatabase: () => void
  onSelectTable: (table: string) => void
}

const fetcher = (url: string): Promise<ApiResponse<Table[]>> =>
  fetch(url).then((res) => res.json())

export function DatabaseNode({
  hostId,
  database,
  isExpanded,
  isTableExpanded,
  selectedTable,
  selectedDatabase,
  level,
  searchFilter,
  onToggle,
  onToggleTable,
  onSelectDatabase,
  onSelectTable,
}: DatabaseNodeProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

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

  const handleToggle = () => {
    if (!shouldFetch) {
      setShouldFetch(true)
    }
    onToggle()
  }

  const showLoadingSkeleton = isLoading && isExpanded && !tables

  return (
    <TreeNode
      label={database}
      icon={DatabaseIcon}
      isExpanded={isExpanded}
      isSelected={selectedDatabase === database && !selectedTable}
      isLoading={isLoading && isExpanded}
      hasChildren
      level={level}
      onToggle={handleToggle}
      onSelect={onSelectDatabase}
    >
      {showLoadingSkeleton ? (
        <div
          className="space-y-1 py-1"
          style={{ paddingLeft: `${(level + 1) * 16}px` }}
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
              readableRows={table.readable_rows}
              isExpanded={isTableExpanded(tableKey)}
              isSelected={
                selectedDatabase === database && selectedTable === table.name
              }
              level={level + 1}
              onToggle={() => onToggleTable(tableKey)}
              onSelect={() => onSelectTable(table.name)}
            />
          )
        })
      )}
    </TreeNode>
  )
}
