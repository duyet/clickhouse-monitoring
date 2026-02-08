'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

/**
 * DetailedTableLevel - Level 3: Detailed breakdown table
 *
 * Shows a full data table with rows of information.
 * Revealed when user expands from key metrics.
 */

export interface TableHeader {
  /** Column key */
  key: string
  /** Column label */
  label: string
  /** Optional alignment */
  align?: 'left' | 'center' | 'right'
  /** Optional width class */
  width?: string
}

export interface TableRow {
  /** Unique identifier for the row */
  id: string
  /** Cell values keyed by column key */
  cells: Record<string, string | number | React.ReactNode>
  /** Optional row click handler */
  onClick?: () => void
  /** Optional row href (makes row a link) */
  href?: string
}

export interface DetailedTableLevelProps {
  /** Table headers */
  headers: TableHeader[]
  /** Table rows */
  rows: TableRow[]
  /** Optional title for the table section */
  title?: string
  /** Optional max rows to display (with "show more" indicator) */
  maxRows?: number
  /** Additional CSS classes */
  className?: string
}
export const DetailedTableLevel = memo(function DetailedTableLevel({
  headers,
  rows,
  title,
  maxRows,
  className,
}: DetailedTableLevelProps) {
  // Limit rows if maxRows is set
  const displayRows = maxRows ? rows.slice(0, maxRows) : rows
  const hasMore = maxRows && rows.length > maxRows

  return (
    <div
      className={cn(
        'flex flex-col gap-2 py-3 px-4',
        'border-t border-border/40',
        'animate-in fade-in-0 slide-in-from-top-1 duration-300 ease-out',
        className
      )}
      role="region"
      aria-label="Detailed breakdown"
    >
      {/* Section title */}
      {title && (
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-border/30">
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'py-2 px-2 text-left font-medium text-muted-foreground whitespace-nowrap',
                    header.align === 'center' && 'text-center',
                    header.align === 'right' && 'text-right',
                    header.width
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {displayRows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border/20 last:border-0',
                  'hover:bg-foreground/[0.02] transition-colors',
                  (row.onClick || row.href) && 'cursor-pointer'
                )}
                onClick={row.onClick}
              >
                {headers.map((header) => (
                  <td
                    key={header.key}
                    className={cn(
                      'py-2 px-2',
                      header.align === 'center' && 'text-center',
                      header.align === 'right' && 'text-right tabular-nums'
                    )}
                  >
                    {row.cells[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* "Show more" indicator */}
      {hasMore && (
        <div className="text-xs text-muted-foreground text-center pt-1">
          +{rows.length - maxRows} more rows
        </div>
      )}
    </div>
  )
})
