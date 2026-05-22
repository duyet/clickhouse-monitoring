'use client'

import type { TextMessagePartComponent } from '@assistant-ui/react'

import { memo } from 'react'
import { Streamdown } from 'streamdown'

import '@/components/agents/markdown-code.css'

/**
 * Markdown renderer for assistant-ui text message parts.
 *
 * Uses `Streamdown` (streaming-aware markdown) so partial tokens render
 * cleanly while a response is in flight, and keeps mermaid diagram support
 * plus the project's existing `.markdown-content` styling from globals.css.
 */
const MarkdownTextImpl: TextMessagePartComponent = ({ text }) => {
  return (
    <div className="markdown-content aui-md text-sm leading-6">
      <Streamdown mermaid={{ config: { theme: 'default' } }}>
        {text ?? ''}
      </Streamdown>
    </div>
  )
}

MarkdownTextImpl.displayName = 'MarkdownText'

export const MarkdownText = memo(MarkdownTextImpl)
