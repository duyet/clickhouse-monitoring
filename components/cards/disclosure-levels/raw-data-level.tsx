'use client'

import { memo, useState, useCallback, useMemo } from 'react'
import { Copy, Check, Code2, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, dedent } from '@/lib/utils'
import { format } from 'sql-formatter'

/**
 * RawDataLevel - Level 4: Raw data/SQL/explanation
 *
 * Shows the underlying SQL query, JSON data, or technical explanation.
 * This is the most detailed level for power users.
 */

export type RawDataType = 'sql' | 'json' | 'text'

export interface RawDataLevelProps {
  /** Type of raw data */
  type: RawDataType
  /** SQL query (when type='sql') */
  sql?: string
  /** JSON data (when type='json') */
  data?: unknown
  /** Plain text content (when type='text') */
  text?: string
  /** Optional title */
  title?: string
  /** Whether to beautify SQL by default */
  beautifySQL?: boolean
  /** Additional CSS classes */
  className?: string
}

export const RawDataLevel = memo(function RawDataLevel({
  type,
  sql,
  data,
  text,
  title,
  beautifySQL = true,
  className,
}: RawDataLevelProps) {
  const [copied, setCopied] = useState(false)
  const [isBeautified, setIsBeautified] = useState(beautifySQL)

  // Format SQL with ClickHouse dialect
  const formattedSQL = useMemo(() => {
    if (type !== 'sql' || !sql) return null

    if (!isBeautified) {
      return dedent(sql)
    }

    try {
      return format(sql, {
        language: 'sql',
        keywordCase: 'upper',
        identifierCase: 'preserve',
        tabWidth: 2,
        linesBetweenQueries: 2,
      })
    } catch {
      // If formatting fails, return dedented original
      return dedent(sql)
    }
  }, [sql, type, isBeautified])

  // Format JSON data
  const formattedJSON = useMemo(() => {
    if (type !== 'json' || !data) return null

    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data, type])

  // Get content to copy
  const contentToCopy = useMemo(() => {
    switch (type) {
      case 'sql':
        return formattedSQL || ''
      case 'json':
        return formattedJSON || ''
      case 'text':
        return text || ''
      default:
        return ''
    }
  }, [type, formattedSQL, formattedJSON, text])

  // Handle copy
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(contentToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [contentToCopy])

  // Get icon for type
  const TypeIcon = type === 'sql' ? Code2 : FileJson

  // Get default title
  const defaultTitle =
    type === 'sql'
      ? 'SQL Query'
      : type === 'json'
        ? 'Raw Data (JSON)'
        : 'Details'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-3 px-4',
        'border-t border-border/40',
        'animate-in fade-in-0 slide-in-from-top-1 duration-300 ease-out',
        className
      )}
      role="region"
      aria-label={defaultTitle}
    >
      {/* Header with title and copy button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TypeIcon
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.5}
          />
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title || defaultTitle}
          </h4>
        </div>

        {/* Beautify toggle for SQL */}
        {type === 'sql' && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <span className="hidden sm:inline">Beautify</span>
            <input
              type="checkbox"
              checked={isBeautified}
              onChange={(e) => setIsBeautified(e.target.checked)}
              className="size-3.5 accent-primary"
            />
          </label>
        )}

        {/* Copy button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3" strokeWidth={1.5} />
          ) : (
            <Copy className="size-3" strokeWidth={1.5} />
          )}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>

      {/* Content */}
      <pre
        className={cn(
          'text-[12px] leading-relaxed font-mono',
          'bg-muted/50 p-3 rounded-lg',
          'overflow-auto max-h-[300px]',
          'border border-border/30'
        )}
      >
        <code className="whitespace-pre-wrap break-words">
          {type === 'sql' && formattedSQL}
          {type === 'json' && formattedJSON}
          {type === 'text' && text}
        </code>
      </pre>
    </div>
  )
})
