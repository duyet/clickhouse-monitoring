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
  row: any
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

function contentReplacement(
  content: string | React.ReactNode,
  row: any
): string | React.ReactNode {
  if (typeof content === 'string') {
    const matches = content.match(/\[(.*?)\]/g)
    if (matches) {
      matches.forEach((match) => {
        const key = match.replace('[', '').replace(']', '').trim()
        const replacementValue = row.getValue(key)
        if (typeof content === 'string') {
          content = content.replace(match, replacementValue)
        }
      })
    }
    return content
  } else {
    return React.Children.map(content, (child) => {
      if (typeof child === 'string') {
        return contentReplacement(child, row)
      } else if (React.isValidElement(child)) {
        return React.cloneElement(
          child,
          {},
          contentReplacement(child.props.children, row)
        )
      }

      // If it's not a string or a valid element, just return it
      return child
    })
  }
}
