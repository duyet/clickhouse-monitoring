'use client'

import { TableIcon } from 'lucide-react'
import useSWR from 'swr'

import { ColumnNode } from './column-node'
import { TreeNode } from './tree-node'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Column {
  name: string
  type: string
  is_in_primary_key: boolean
  is_in_sorting_key: boolean
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

interface TableNodeProps {
  hostId: number
  database: string
  table: string
  readableRows?: string
  isExpanded: boolean
  isSelected: boolean
  level: number
  onToggle: () => void
  onSelect: () => void
}

const fetcher = (url: string): Promise<ApiResponse<Column[]>> =>
  fetch(url).then((res) => res.json())

export function TableNode({
  hostId,
  database,
  table,
  readableRows,
  isExpanded,
  isSelected,
  level,
  onToggle,
  onSelect,
}: TableNodeProps) {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data: response, isLoading } = useSWR<ApiResponse<Column[]>>(
    shouldFetch
      ? `/api/v1/explorer/columns?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher
  )

  const columns = response?.data

  const handleToggle = () => {
    if (!shouldFetch) {
      setShouldFetch(true)
    }
    onToggle()
  }

  const showLoadingSkeleton = isLoading && isExpanded && !columns

  return (
    <TreeNode
      label={table}
      icon={TableIcon}
      isExpanded={isExpanded}
      isSelected={isSelected}
      isLoading={isLoading && isExpanded}
      hasChildren
      expandOnSelect={false}
      level={level}
      badge={
        readableRows ? (
          <Badge variant="outline" className="text-xs">
            {readableRows}
          </Badge>
        ) : undefined
      }
      onToggle={handleToggle}
      onSelect={onSelect}
    >
      {showLoadingSkeleton ? (
        <div
          className="space-y-1 py-1"
          style={{ paddingLeft: `${(level + 1) * 16}px` }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-[70%]" />
          ))}
        </div>
      ) : (
        columns?.map((column) => (
          <ColumnNode
            key={column.name}
            name={column.name}
            type={column.type}
            isInPrimaryKey={column.is_in_primary_key}
            isInSortingKey={column.is_in_sorting_key}
            level={level + 1}
          />
        ))
      )}
    </TreeNode>
  )
}
