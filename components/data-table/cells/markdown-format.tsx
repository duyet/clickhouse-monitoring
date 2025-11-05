import { cn } from '@/lib/utils'
import Markdown from 'react-markdown'

export interface MarkdownFormatOptions {
  className?: string
}

interface MarkdownFormatProps {
  value: React.ReactNode
  options?: MarkdownFormatOptions
}

export function MarkdownFormat({
  value,
  options,
}: MarkdownFormatProps): React.ReactNode {
  return (
    <span className={cn('truncate text-wrap', options?.className)}>
      <Markdown>{`${!!value ? value : ''}`}</Markdown>
    </span>
  )
}
