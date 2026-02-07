'use client'

import { ExternalLink, Info } from 'lucide-react'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SuggestionCardProps {
  suggestion: string
  className?: string
}

/**
 * Renders suggestion text with formatted code blocks, links, and better visual hierarchy
 * Detects URLs and converts them to clickable links
 * Handles multi-line text with code blocks gracefully
 *
 * Text is truncated with line-clamp and expands to a modal when clicked
 */
export function SuggestionCard({ suggestion, className }: SuggestionCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  // Split by code block markers or detect SQL patterns
  const parts = parseIntelligent(suggestion)

  // Check if content overflows after mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: Re-measuring on suggestion change is intentional
  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    // Check after a short delay to ensure rendering is complete
    const timer = requestAnimationFrame(() => {
      setIsOverflowing(element.scrollHeight > element.clientHeight)
    })

    return () => cancelAnimationFrame(timer)
  }, [suggestion])

  // Render the truncated content
  const renderContent = (isInModal = false) => (
    <div
      className={cn(isInModal ? 'max-h-[70vh] overflow-y-auto' : 'space-y-3')}
    >
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return (
            <p
              key={idx}
              className={cn(
                'text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap',
                !isInModal && 'line-clamp-3'
              )}
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

  const handleClick = useCallback(() => {
    if (isOverflowing) {
      setIsOpen(true)
    }
  }, [isOverflowing])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isOverflowing) {
          setIsOpen(true)
        }
      }
    },
    [isOverflowing]
  )

  return (
    <>
      <div
        ref={contentRef}
        className={cn(
          'rounded-lg border border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4 relative',
          isOverflowing && 'cursor-pointer',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={isOverflowing ? 'button' : undefined}
        tabIndex={isOverflowing ? 0 : -1}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {renderContent(false)}
        {isOverflowing && (
          <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Info className="h-3.5 w-3.5" />
            <span>Click to view full suggestion</span>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Suggestion</DialogTitle>
            <DialogDescription>
              Full suggestion details and configuration help
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              'rounded-lg border border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4'
            )}
          >
            {renderContent(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
