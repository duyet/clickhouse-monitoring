'use client'

import { ExternalLink, Info } from 'lucide-react'

import type { TableGuidance } from '@/lib/table-guidance'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface OptionalTableInfoProps {
  /** The table name (e.g., "system.text_log") */
  tableName: string
  /** Guidance for enabling the table */
  guidance: TableGuidance
  /** Optional custom title */
  title?: string
  /** Custom className */
  className?: string
}

/**
 * OptionalTableInfo Component
 *
 * Displays helpful information when an optional ClickHouse system table is missing.
 * Shows configuration instructions and links to official documentation.
 *
 * @example
 * ```tsx
 * import { OptionalTableInfo } from '@/components/feedback/optional-table-info'
 * import { getTableGuidance } from '@/lib/table-guidance'
 *
 * const guidance = getTableGuidance('system.text_log')
 * if (guidance) {
 *   return <OptionalTableInfo tableName="system.text_log" guidance={guidance} />
 * }
 * ```
 */
export function OptionalTableInfo({
  tableName,
  guidance,
  title,
  className,
}: OptionalTableInfoProps) {
  return (
    <Card
      className={cn(
        'rounded-md border-blue-200/50 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20 shadow-none py-2',
        className
      )}
      role="status"
      aria-label={`Information about ${tableName}`}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-2">
              {title ||
                (tableName === 'system.text_log'
                  ? 'Text Log Not Configured'
                  : tableName === 'system.crash_log'
                    ? 'Crash Log Not Available'
                    : 'Table Not Available')}
            </h3>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-3">
              <div className="leading-relaxed">
                {/* Handle markdown-like code blocks by splitting and rendering */}
                {guidance.enableInstructions
                  .split(/```/g)
                  .map((part, index) => {
                    // Odd indices are inside code blocks
                    if (index % 2 === 1) {
                      const language = part.split('\n')[0] || ''
                      const codeContent = part
                        .split('\n')
                        .slice(language ? 1 : 0)
                        .join('\n')
                        .trim()

                      return (
                        <pre
                          key={`code-${index}`}
                          className="mt-2 mb-2 p-3 bg-black/50 dark:bg-black/70 text-white dark:text-white text-xs rounded border border-blue-900/50 overflow-x-auto"
                        >
                          <code>{codeContent}</code>
                        </pre>
                      )
                    }

                    // Even indices are regular text
                    if (part.trim()) {
                      return (
                        <div
                          key={`text-${index}`}
                          className="whitespace-pre-wrap"
                        >
                          {part.trim()}
                        </div>
                      )
                    }
                    return null
                  })}
              </div>

              {/* Documentation link */}
              {guidance.docsUrl && (
                <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50">
                  <a
                    href={guidance.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View ClickHouse documentation
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
