import type { Row } from '@tanstack/react-table'

import { Fragment, memo } from 'react'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent as RadixHoverCardContent,
} from '@/components/ui/hover-card'
import { replaceTemplateInReactNode } from '@/lib/template-utils'

export type HoverCardContent = string | React.ReactNode

export type HoverCardOptions = {
  content: HoverCardContent
}

interface HoverCardProps {
  row: Row<any>
  value: React.ReactNode | bigint | string | number
  options?: HoverCardOptions
}

export const HoverCardFormat = memo(function HoverCardFormat({
  row,
  value,
  options,
}: HoverCardProps): React.ReactNode {
  const { content } = options || {}

  // Convert bigint to string for React v19 compatibility
  const displayValue = typeof value === 'bigint' ? value.toString() : value

  // Extract row data for template replacement
  // Uses row.getValue() for each column to get the value
  const rowData = extractRowData(content, row)

  // Convert all bigint values to strings for React v19 compatibility
  const safeRowData = Object.entries(rowData).reduce(
    (acc, [key, value]) => {
      acc[key] = typeof value === 'bigint' ? value.toString() : value
      return acc
    },
    {} as Record<string, unknown>
  )

  // Content replacement, e.g. "Hover content: [column_name]"
  // Convert content to string if it's a bigint for React v19 compatibility
  const safeContent = typeof content === 'bigint' ? content.toString() : content
  const processedContent = replaceTemplateInReactNode(safeContent, safeRowData)

  // Ensure processedContent is always a string for React v19 compatibility
  const displayContent =
    typeof processedContent === 'string'
      ? processedContent
      : String(processedContent)

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        <Fragment>{displayValue}</Fragment>
      </HoverCardTrigger>
      <RadixHoverCardContent role="tooltip">
        {displayContent}
      </RadixHoverCardContent>
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
