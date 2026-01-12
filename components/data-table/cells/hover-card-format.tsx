import type { Row } from '@tanstack/react-table'

import React, { memo } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
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

export const HoverCardFormat = memo(function HoverCardFormat({
  row,
  value,
  options,
}: HoverCardProps): React.ReactNode {
  const { content } = options || {}

  // Convert value to ReactNode-compatible type (React v19 doesn't allow bigint)
  // Filter out bigint since it's not compatible with Radix UI's React types
  const renderableValue: React.ReactNode = React.isValidElement(value)
    ? value
    : typeof value === 'bigint'
      ? String(value)
      : String(value)

  // Extract row data for template replacement
  // Uses row.getValue() for each column to get the value
  const rowData = extractRowData(content, row)

  // Content replacement, e.g. "Hover content: [column_name]"
  // Use any to avoid ReactNode type conflicts
  const processedContent = replaceTemplateInReactNode(content, rowData) as any

  // Use explicit string type to avoid ReactNode conflicts with bigint
  // between React 19 and Radix UI's nested React type dependencies
  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        {renderableValue as any}
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">
        {processedContent as any}
      </HoverCardContent>
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
