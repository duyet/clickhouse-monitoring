import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import React from 'react'

export type HoverCardContent = string | React.ReactNode

export type HoverCardOptions = {
  content: HoverCardContent
}

interface HoverCardProps {
  row: { getValue: (key: string) => string }
  value: any
  options?: HoverCardOptions
}

export function HoverCardFormat({ row, value, options }: HoverCardProps) {
  let { content } = options || {}

  // Content replacement, e.g. "Hover content: [column_name]"
  content = contentReplacement(content, row)

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger>{value}</HoverCardTrigger>
      <HoverCardContent>{content}</HoverCardContent>
    </HoverCard>
  )
}

/**
 * Content replacement function
 *
 * e.g. string content
 *  content: 'Hover content: [column_name]'
 *  row: { getValue: (key: string) => `value-for-${key}` }
 *  result: 'Hover content: value-for-column_name'
 *
 * e.g. ReactNode content
 *  content: <div id="hover-content">Hover content: [column_name]</div>
 *  row: { getValue: (key: string) => `value-for-${key}` }
 *  result: <div id="hover-content">Hover content: value-for-column_name</div>
 *
 * e.g. Nested content replacement
 *  content: <div><div>[col1]</div><p>[col2]</p></div>
 *  row: { getValue: (key: string) => `value-for-${key}` }
 *  result: <div><div>value-for-col1</div><p>value-for-col2</p></div>
 *
 * @param content
 * @param row
 * @returns
 */
function contentReplacement(
  content: string | React.ReactNode,
  row: HoverCardProps['row']
): string | React.ReactNode {
  // Handle string content
  if (typeof content === 'string') {
    return content.replace(/\[(.*?)\]/g, (match) => {
      const key = match.slice(1, -1).trim()
      return row.getValue(key)
    })
  }

  // Handle React elements
  if (React.isValidElement(content)) {
    const props = content.props as { children?: React.ReactNode }

    const childContent = contentReplacement(
      React.isValidElement(props.children)
        ? props.children
        : String(props.children || ''),
      row
    )

    if (childContent === props.children) {
      return content
    }

    return React.cloneElement(content, {}, childContent)
  }

  // Handle arrays of children
  if (Array.isArray(content)) {
    return content.map((child, index) => contentReplacement(child, row))
  }

  // Return unchanged if content is neither string nor React element
  return content
}
