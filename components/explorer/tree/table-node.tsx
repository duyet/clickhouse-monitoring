'use client'

import { TableIcon } from 'lucide-react'
import useSWR from 'swr'

import { ColumnNode } from './column-node'
import { TreeNode } from './tree-node'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
  totalRows?: number
  isExpanded: boolean
  isSelected: boolean
  level: number
  onToggle: () => void
  onSelect: () => void
}

const fetcher = (url: string): Promise<ApiResponse<Column[]>> =>
  fetch(url).then((res) => res.json())

/**
 * Format row count for display from raw number.
 * - 0 → "0"
 * - 1500 → "1.5K"
 * - 103194 → "103K" (rounded)
 * - 1250000 → "1.3M"
 * - 1000000 → "1M"
 */
function formatRowCount(rows: number): string {
  if (rows === 0) return '0'

  const thresholds = [
    { value: 1_000_000, suffix: 'M' },
    { value: 1_000, suffix: 'K' },
  ]

  for (const { value, suffix } of thresholds) {
    if (rows >= value) {
      const formatted = rows / value
      // Round to 1 decimal place if needed, otherwise whole number
      const rounded =
        formatted % 1 === 0
          ? Math.round(formatted)
          : formatted.toFixed(1).replace(/\.0$/, '')
      return `${rounded}${suffix}`
    }
  }

  return rows.toString()
}

function RowCountBadge({ totalRows }: { totalRows: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const formatted = formatRowCount(totalRows)
  const suffix = totalRows === 1 ? '\u00A0row' : '\u00A0rows'

  return (
    <span
      role="presentation"
      className="ml-auto text-[10px] text-muted-foreground tabular-nums cursor-default overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="inline-flex">
        {formatted}
        <span
          className={cn(
            'inline-block transition-all duration-200 ease-out',
            isHovered ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0'
          )}
        >
          {suffix}
        </span>
      </span>
    </span>
  )
}

export function TableNode({
  hostId,
  database,
  table,
  totalRows,
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
        totalRows !== undefined && totalRows !== null ? (
          <RowCountBadge totalRows={totalRows} />
        ) : undefined
      }
      onToggle={handleToggle}
      onSelect={onSelect}
    >
      {showLoadingSkeleton ? (
        <div
          className="space-y-1 py-1"
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
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
