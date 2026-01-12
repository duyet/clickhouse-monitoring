import type { Row } from '@tanstack/react-table'

import { isValidElement, memo } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { toReactNode } from '@/lib/react19-compat'
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

  // Extract row data for template replacement
  // Uses row.getValue() for each column to get the value
  const rowData = extractRowData(content, row)

  // Content replacement, e.g. "Hover content: [column_name]"
  const processedContent = replaceTemplateInReactNode(content, rowData)

  // Convert to React 19 compatible ReactNode
  const safeContent = toReactNode(processedContent)

  // Convert the value to a safe format for Radix UI compatibility
  // This handles bigint values that would otherwise cause type conflicts
  const getSafeValue = (): React.ReactNode => {
    if (typeof value === 'bigint') {
      return String(value)
    }
    if (isValidElement(value)) {
      return value
    }
    if (value === null || value === undefined) {
      return null
    }
    if (typeof value === 'object') {
      // Filter out bigints from arrays and objects
      if (Array.isArray(value)) {
        return value.map((v) => {
          if (typeof v === 'bigint') return String(v)
          return v
        })
      }
      // Convert plain objects to strings
      return JSON.stringify(value)
    }
    return value
  }

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        {getSafeValue() as any}
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">{safeContent as any}</HoverCardContent>
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
          const value = row.getValue(key)
          // Filter out bigint values which are not valid ReactNode in React 19
          if (typeof value !== 'bigint') {
            data[key] = value
          }
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
