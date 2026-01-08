'use client'

import { ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SuggestionCardProps {
  suggestion: string
  className?: string
}

/**
 * Renders suggestion text with formatted code blocks, links, and better visual hierarchy
 * Detects URLs and converts them to clickable links
 * Handles multi-line text with code blocks gracefully
 */
export function SuggestionCard({ suggestion, className }: SuggestionCardProps) {
  // Split by code block markers or detect SQL patterns
  const parts = parseIntelligent(suggestion)

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4 space-y-3',
        className
      )}
    >
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return (
            <p
              key={idx}
              className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
            >
              {renderTextWithLinks(part.content)}
            </p>
          )
        }

        if (part.type === 'code') {
          return (
            <pre
              key={idx}
              className="bg-slate-900 dark:bg-slate-950 text-slate-50 rounded-md p-3 text-xs overflow-x-auto border border-slate-700 dark:border-slate-800"
            >
              <code className="font-mono">{part.content}</code>
            </pre>
          )
        }

        if (part.type === 'sql') {
          return (
            <pre
              key={idx}
              className="bg-slate-900 dark:bg-slate-950 text-amber-100 rounded-md p-3 text-xs overflow-x-auto border border-amber-900/30 dark:border-amber-800/30"
            >
              <code className="font-mono">{part.content}</code>
            </pre>
          )
        }

        return null
      })}
    </div>
  )
}

interface TextPart {
  type: 'text' | 'code' | 'sql'
  content: string
}

/**
 * Intelligently parse suggestion text to detect:
 * - SQL statements (SELECT, CREATE, SET, etc.)
 * - Code blocks (```...```)
 * - Regular text
 */
function parseIntelligent(text: string): TextPart[] {
  const parts: TextPart[] = []

  // Handle markdown code blocks first
  const codeBlockRegex = /```([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      })
    }

    // Detect if it's SQL
    const codeContent = match[1].trim()
    const isSql =
      /^\s*(SELECT|CREATE|SET|ALTER|DROP|INSERT|UPDATE|DELETE|SHOW|EXPLAIN)/i.test(
        codeContent
      )

    parts.push({
      type: isSql ? 'sql' : 'code',
      content: codeContent,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    })
  }

  // If no code blocks found, try to detect SQL statements
  if (parts.length === 0) {
    const sqlRegex =
      /(^|\n)((?:SELECT|CREATE|SET|ALTER|DROP|INSERT|UPDATE|DELETE|SHOW|EXPLAIN)[\s\S]*?)(?=\n\n|\n[0-9]+\.|$)/gm
    lastIndex = 0

    while ((match = sqlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        })
      }

      parts.push({
        type: 'sql',
        content: match[2].trim(),
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      })
    }
  }

  // Filter out empty parts
  return parts.filter((p) => p.content.trim().length > 0)
}

/**
 * Render text with clickable links
 * Detects URLs starting with http/https or www.
 */
function renderTextWithLinks(text: string): React.ReactNode {
  // URL regex that matches http/https URLs and www URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g

  const parts = text.split(urlRegex)

  return parts.map((part, idx) => {
    if (!part) return null

    // Check if this part is a URL
    if (urlRegex.test(part)) {
      const href = part.startsWith('www.') ? `https://${part}` : part

      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
        >
          {part}
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      )
    }

    return <span key={idx}>{part}</span>
  })
}
