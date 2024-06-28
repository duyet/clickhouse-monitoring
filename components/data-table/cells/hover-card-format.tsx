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

  if (!content) {
    content = value
  }

  // Content replacement, e.g. "Hover content: [column_name]"
  if (
    typeof content === 'string' &&
    content.includes('[') &&
    content.includes(']')
  ) {
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
  }
  return (
    <HoverCard>
      <HoverCardTrigger>{value}</HoverCardTrigger>
      <HoverCardContent>{content}</HoverCardContent>
    </HoverCard>
  )
}
