'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ExpandableCellProps {
  /** The text content to display */
  value: string
  /** Max character length before truncation (default: 120) */
  maxLength?: number
  /** Additional CSS classes for the trigger element */
  className?: string
}

/**
 * ExpandableCell - Shows truncated text with a click-to-expand popover
 *
 * When content exceeds maxLength characters it is truncated with ellipsis.
 * Clicking opens a popover showing the full content.
 * Used for SQL queries, error messages, and other long-text columns.
 */
export function ExpandableCell({
  value,
  maxLength = 120,
  className,
}: ExpandableCellProps) {
  const [open, setOpen] = useState(false)
  const stringValue = String(value ?? '')

  if (stringValue.length <= maxLength) {
    return <span className={cn('truncate', className)}>{stringValue}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'max-w-xs truncate cursor-pointer text-left underline decoration-dotted decoration-muted-foreground/40 underline-offset-2 hover:decoration-muted-foreground/80 transition-colors',
            className
          )}
          title="Click to expand"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
        >
          {stringValue.slice(0, maxLength)}…
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-h-64 overflow-y-auto p-3"
        align="start"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed text-foreground">
          {stringValue}
        </pre>
      </PopoverContent>
    </Popover>
  )
}
