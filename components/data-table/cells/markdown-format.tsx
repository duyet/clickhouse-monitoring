import { memo } from 'react'
import Markdown from 'react-markdown'

import { cn } from '@/lib/utils'

export interface MarkdownFormatOptions {
  className?: string
}

interface MarkdownFormatProps {
  value: React.ReactNode
  options?: MarkdownFormatOptions
}

export const MarkdownFormat = memo(function MarkdownFormat({
  value,
  options,
}: MarkdownFormatProps): React.ReactNode {
  return (
    <span className={cn('truncate text-wrap', options?.className)}>
      <Markdown>{`${value ? value : ''}`}</Markdown>
    </span>
  )
})
