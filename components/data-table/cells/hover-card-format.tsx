import type { Row } from '@tanstack/react-table'

import * as React from 'react'
import { memo } from 'react'
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

/**
 * Convert ReactNode to a type compatible with Radix UI components
 * Converts bigint to string since it's not supported in React 19's ReactNode
 */
function sanitizeReactNode(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'bigint') {
    return node.toString()
  }
  if (typeof node === 'object' && node !== null) {
    if (Array.isArray(node)) {
      return node.map(sanitizeReactNode)
    }
    // Handle React elements
    if (React.isValidElement(node)) {
      // Recursively sanitize children
      const props = node.props as { children?: React.ReactNode }
      if (props.children) {
        return React.cloneElement(node, {}, sanitizeReactNode(props.children))
      }
      return node
    }
  }
  return node
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

  // Also sanitize the value to handle potential bigint
  const sanitizedValue = sanitizeReactNode(value)

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        {sanitizedValue as any}
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">
        {sanitizeReactNode(processedContent) as any}
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
