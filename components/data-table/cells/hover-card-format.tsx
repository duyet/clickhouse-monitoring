import type { Row } from '@tanstack/react-table'

import { memo } from 'react'
import { replaceTemplateInReactNode } from '@/lib/template-utils'

export type HoverCardContent = string | React.ReactNode

export type HoverCardOptions = {
  content: HoverCardContent
}

interface HoverCardProps {
  row: Row<any>
  value: React.ReactNode
  options?: HoverCardOptions
}

// Temporarily disabled due to React 19 compatibility issues
export const HoverCardFormat = memo(function HoverCardFormat({
  row,
  value,
  options,
}: HoverCardProps): React.ReactNode {
  const { content } = options || {}

  // Extract row data for template replacement
  // Uses row.getValue() for each column to get the value
  const rowData = extractRowData(content, row)

  // Content replacement, e.g. "Hover content: [column_name]"
  const processedContent = replaceTemplateInReactNode(content, rowData)

  // Convert value to string if it's a bigint for ReactNode compatibility
  const displayValue = typeof value === 'bigint' ? String(value) : value

  return (
    <div className="group relative inline-block">
      <span className="cursor-help">{displayValue}</span>
      <div className="hidden group-hover:block absolute z-10 mt-2 w-64 rounded-md border bg-popover p-4 shadow-md text-popover-foreground">
        {typeof processedContent === 'bigint'
          ? String(processedContent)
          : processedContent}
      </div>
    </div>
  )
})

/**
 * Extract row data for columns referenced in the content template
 * Uses row.getValue() to support TanStack Table's column accessors
 */
function extractRowData(
  content: string | React.ReactNode | undefined,
  row: Row<unknown>
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // Find all [key] placeholders in content
  const extractKeys = (node: string | React.ReactNode | undefined): void => {
    if (typeof node === 'string') {
      const matches = node.match(/\[(.*?)\]/g)
      if (matches) {
        for (const match of matches) {
          const key = match.slice(1, -1).trim()
          const value = row.getValue(key)
          // Convert bigint to string for ReactNode compatibility
          data[key] = typeof value === 'bigint' ? String(value) : value
        }
      }
    } else if (node && typeof node === 'object') {
      // Handle React children recursively
      const children = (node as { props?: { children?: React.ReactNode } })
        .props?.children
      if (children) {
        if (Array.isArray(children)) {
          children.forEach(extractKeys)
        } else {
          extractKeys(children)
        }
      }
    }
  }

  extractKeys(content)
  return data
}
