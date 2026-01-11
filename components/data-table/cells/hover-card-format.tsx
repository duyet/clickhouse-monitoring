import type { Row } from '@tanstack/react-table'

import { memo } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { replaceTemplateInReactNode } from '@/lib/template-utils'

/**
 * Convert bigint values to strings for React 19 compatibility
 * React 19's ReactNode no longer includes bigint automatically
 */
function convertValueForReact(value: unknown): string | React.ReactNode {
  if (typeof value === 'bigint') {
    return String(value)
  }
  // Convert to string if value is a primitive type that might not be valid ReactNode
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null || value === undefined) {
    return ''
  }
  // Return as-is for strings and valid React elements
  return value as string | React.ReactNode
}

export type HoverCardContent = string | React.ReactNode | number | bigint

export type HoverCardOptions = {
  content: HoverCardContent
}

interface HoverCardProps {
  row: Row<any>
  value: React.ReactNode
  options?: HoverCardOptions
}

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

  // For React 19 compatibility, ensure value and processedContent don't contain bigint
  const renderValue = convertValueForReact(value)
  const renderContent =
    typeof processedContent === 'bigint'
      ? String(processedContent)
      : processedContent

  // Convert to string explicitly to handle any remaining type issues
  const valueToRender =
    typeof renderValue === 'string'
      ? renderValue
      : (renderValue as any)?.toString?.() || String(renderValue)

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        {valueToRender}
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">{renderContent as any}</HoverCardContent>
    </HoverCard>
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
          data[key] = row.getValue(key)
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
