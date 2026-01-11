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

  // Extract row data for template replacement
  // Uses row.getValue() for each column to get the value
  const rowData = extractRowData(content, row)

  // Content replacement, e.g. "Hover content: [column_name]"
  const processedContent = replaceTemplateInReactNode(content, rowData)

  // Convert bigint values to string for React 19 compatibility
  const safeValue = convertReactNodeToString(value)
  const safeContent = convertReactNodeToString(processedContent)

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        {safeValue as any}
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">{safeContent as any}</HoverCardContent>
    </HoverCard>
  )
})

// Convert bigint values in ReactNode to strings for React 19 compatibility
function convertReactNodeToString(
  node: React.ReactNode
): string | React.ReactElement | null {
  if (typeof node === 'bigint') {
    return String(node)
  }
  if (typeof node === 'string') {
    return node
  }
  if (typeof node === 'number') {
    return String(node)
  }
  if (typeof node === 'boolean') {
    return node ? 'true' : ''
  }
  if (node == null) {
    return null
  }
  if (Array.isArray(node)) {
    // Return array of converted children - filter out nulls that might cause issues
    const converted = node
      .map(convertReactNodeToString)
      .filter((n) => n !== null && n !== '')
    return converted.length > 0 ? <>{converted}</> : null
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return React.cloneElement(
      element,
      {},
      convertReactNodeToString(element.props.children)
    )
  }
  // Handle other types that might slip through
  return String(node)
}

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
