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
}: HoverCardProps) {
  const { content } = options || {}

  // Convert bigint values for React 19 compatibility
  const safeValue =
    typeof value === 'bigint'
      ? value.toString()
      : React.isValidElement(value)
        ? value
        : (value as React.ReactNode)

  // Extract row data for template replacement
  // Uses row.getValue() for each column to get the value
  const rowData = extractRowData(content, row)

  // Content replacement, e.g. "Hover content: [column_name]"
  const processedContent = replaceTemplateInReactNode(content, rowData)

  // Convert processed content to string if it's a bigint
  const safeProcessedContent =
    typeof processedContent === 'bigint'
      ? processedContent.toString()
      : React.isValidElement(processedContent)
        ? processedContent
        : (processedContent as React.ReactNode)

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger aria-label="Show details">
        <React.Fragment>{safeValue}</React.Fragment>
      </HoverCardTrigger>
      <HoverCardContent role="tooltip">
        <React.Fragment>{safeProcessedContent}</React.Fragment>
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
          const value = row.getValue(key)
          // Convert bigint to string for React 19 compatibility
          data[key] = typeof value === 'bigint' ? value.toString() : value
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
