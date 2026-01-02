'use client'

import {
  CopyIcon,
  RotateCcwIcon,
  SortAscIcon,
  SortDescIcon,
} from 'lucide-react'
import type { Header } from '@tanstack/react-table'

import { memo, useCallback, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ColumnHeaderDropdownProps {
  header: Header<any, unknown>
}

export const ColumnHeaderDropdown = memo(function ColumnHeaderDropdown({
  header,
}: ColumnHeaderDropdownProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const column = header.column
  const canSort = column.getCanSort()

  const handleSortAsc = useCallback(
    (e: React.MouseEvent) => {
      column.toggleSorting(false)
      // Close and re-open dropdown to force re-render with new sort
      setOpen(false)
      setTimeout(() => setOpen(true), 0)
    },
    [column]
  )

  const handleSortDesc = useCallback(
    (e: React.MouseEvent) => {
      column.toggleSorting(true)
      // Close and re-open dropdown to force re-render with new sort
      setOpen(false)
      setTimeout(() => setOpen(true), 0)
    },
    [column]
  )

  const handleResetSort = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      column.clearSorting()
      // Keep dropdown open after reset
    },
    [column]
  )

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      navigator.clipboard.writeText(column.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    [column.id]
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'opacity-0 group-hover:opacity-40 hover:opacity-100 focus:opacity-100',
            'focus:outline-none transition-opacity',
            'disabled:cursor-default disabled:opacity-50'
          )}
          aria-label="Column options"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40" sticky="always">
        {canSort && (
          <>
            <DropdownMenuItem onClick={handleSortAsc}>
              <SortAscIcon className="mr-2 h-3.5 w-3.5" />A → Z
              {column.getIsSorted() === 'asc' && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSortDesc}>
              <SortDescIcon className="mr-2 h-3.5 w-3.5" />Z → A
              {column.getIsSorted() === 'desc' && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
          </>
        )}
        {(canSort || column.getIsSorted()) && (
          <DropdownMenuItem onClick={handleResetSort}>
            <RotateCcwIcon className="mr-2 h-3.5 w-3.5" />
            Reset sort
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          <CopyIcon className="mr-2 h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Copy name'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
