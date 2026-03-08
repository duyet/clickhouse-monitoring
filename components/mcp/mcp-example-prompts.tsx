'use client'

import { Check, Copy, MessageSquare } from 'lucide-react'

import { EXAMPLE_PROMPTS } from './mcp-tools-data'
import { useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function PromptItem({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [prompt])

  return (
    <button
      onClick={handleCopy}
      className="group w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm truncate">{prompt}</span>
      </div>
      <span className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  )
}

export function McpExamplePrompts() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Example Prompts</CardTitle>
        <CardDescription className="text-xs">
          Click any prompt to copy it. Paste into Claude, Cursor, or any
          MCP-compatible AI assistant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {EXAMPLE_PROMPTS.map((group) => (
          <div key={group.category} className="space-y-2">
            <Badge variant="outline" className="text-xs">
              {group.category}
            </Badge>
            <div className="space-y-1.5">
              {group.prompts.map((prompt) => (
                <PromptItem key={prompt} prompt={prompt} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
