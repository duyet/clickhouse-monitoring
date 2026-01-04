import {
  Check,
  Clock,
  CodeIcon,
  Copy,
  Database,
  ExternalLink,
  Hash,
  Info,
  Server,
  SparklesIcon,
  Zap,
} from 'lucide-react'

import type { ApiResponseMetadata } from '@/lib/api/types'

import { memo, useCallback, useMemo, useState } from 'react'
import { format } from 'sql-formatter'
import {
  DialogContent,
  type DialogContentProps,
} from '@/components/dialogs/dialog-content'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { dedent } from '@/lib/utils'

interface ShowSQLButtonProps extends Omit<DialogContentProps, 'content'> {
  sql?: string
  /** Enable full-screen mode */
  fullScreen?: boolean
  /** Query execution metadata */
  metadata?: Partial<ApiResponseMetadata>
}

const STORAGE_KEY = 'sql-beautify'

/** Get initial beautify state from localStorage */
function getInitialBeautifyState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Save beautify state to localStorage */
function saveBeautifyState(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Ignore storage errors
  }
}

/** Format SQL with ClickHouse dialect */
function formatSQL(sql: string): string {
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
}

/** Format duration for display */
function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** Copyable value component */
function CopyableValue({
  value,
  className = '',
}: {
  value: string | number
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className={`font-mono font-medium text-right truncate min-w-0 hover:text-primary cursor-pointer transition-colors inline-flex items-center gap-1 group/copy ${className}`}
      title={`Click to copy: ${value}`}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="size-3 text-green-500 shrink-0" strokeWidth={2} />
      ) : (
        <Copy
          className="size-3 opacity-0 group-hover/copy:opacity-50 shrink-0 transition-opacity"
          strokeWidth={1.5}
        />
      )}
    </button>
  )
}

export const DialogSQL = memo(function DialogSQL({
  button,
  title = 'SQL Code',
  description = 'Raw SQL code of this table',
  sql,
  fullScreen = true,
  metadata,
  ...props
}: ShowSQLButtonProps) {
  const [isFullScreen, _setIsFullScreen] = useState(fullScreen)
  const [isBeautified, setIsBeautified] = useState(getInitialBeautifyState)
  const [copied, setCopied] = useState(false)

  const handleBeautifyToggle = useCallback((checked: boolean) => {
    setIsBeautified(checked)
    saveBeautifyState(checked)
  }, [])

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Build full API URL for debugging
  const fullApiUrl = useMemo(() => {
    if (!metadata?.api) return null
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return metadata.api.startsWith('http')
      ? metadata.api
      : `${baseUrl}${metadata.api}`
  }, [metadata?.api])

  // Check if we have metadata to show
  const hasMetadata =
    metadata &&
    (metadata.duration !== undefined ||
      metadata.rows !== undefined ||
      metadata.clickhouseVersion ||
      metadata.host ||
      metadata.queryId ||
      metadata.api)

  if (!sql) {
    return null
  }

  const displaySQL = isBeautified ? formatSQL(sql) : dedent(sql)

  return (
    <DialogContent
      button={
        button ? (
          button
        ) : (
          <Button
            variant="outline"
            className="ml-auto"
            aria-label="Show SQL"
            title="Show SQL for this table"
          >
            <CodeIcon className="size-4" />
          </Button>
        )
      }
      title={title}
      description={description}
      headerActions={
        <>
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Beautify</span>
            <Switch
              checked={isBeautified}
              onCheckedChange={handleBeautifyToggle}
              aria-label="Toggle SQL beautification"
              className="scale-75"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs text-muted-foreground px-2"
            onClick={() => handleCopy(displaySQL)}
          >
            {copied ? (
              <Check className="size-3" strokeWidth={1.5} />
            ) : (
              <Copy className="size-3" strokeWidth={1.5} />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </>
      }
      content={
        <div className="flex flex-col gap-3">
          {/* Metadata Section */}
          {hasMetadata && (
            <div className="rounded-lg border border-border/50 p-3">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Info className="size-3" strokeWidth={1.5} />
                Request Info
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {fullApiUrl && (
                  <div className="col-span-2 flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <ExternalLink className="size-3" strokeWidth={1.5} />
                      API
                    </dt>
                    <dd className="min-w-0 flex-1 text-right">
                      <button
                        onClick={() => handleCopy(fullApiUrl)}
                        className="font-mono text-[11px] truncate max-w-full hover:text-primary cursor-pointer transition-colors inline-flex items-center gap-1 group/copy"
                        title={`Click to copy: ${fullApiUrl}`}
                      >
                        <span className="truncate">
                          {metadata?.api || fullApiUrl}
                        </span>
                        <Copy
                          className="size-2.5 opacity-40 group-hover/copy:opacity-100 shrink-0 transition-opacity"
                          strokeWidth={1.5}
                        />
                      </button>
                    </dd>
                  </div>
                )}
                {metadata?.duration !== undefined && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Clock className="size-3" strokeWidth={1.5} />
                      Duration
                    </dt>
                    <CopyableValue value={formatDuration(metadata.duration)} />
                  </div>
                )}
                {metadata?.rows !== undefined && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Database className="size-3" strokeWidth={1.5} />
                      Rows
                    </dt>
                    <CopyableValue value={metadata.rows.toLocaleString()} />
                  </div>
                )}
                {metadata?.clickhouseVersion && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Zap className="size-3" strokeWidth={1.5} />
                      Version
                    </dt>
                    <CopyableValue value={metadata.clickhouseVersion} />
                  </div>
                )}
                {metadata?.host && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Server className="size-3" strokeWidth={1.5} />
                      Host
                    </dt>
                    <CopyableValue value={metadata.host} />
                  </div>
                )}
                {metadata?.queryId && (
                  <div className="col-span-2 flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Hash className="size-3" strokeWidth={1.5} />
                      Query ID
                    </dt>
                    <CopyableValue value={metadata.queryId} />
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* SQL code display */}
          <pre
            className={cn(
              'overflow-auto rounded-lg bg-muted/50 p-3',
              'font-mono leading-relaxed',
              isFullScreen
                ? 'max-h-[calc(100vh-18rem)] text-sm'
                : 'max-h-[50vh] text-[10px]'
            )}
          >
            <code className="whitespace-pre-wrap break-words">
              {displaySQL}
            </code>
          </pre>

          {/* Info footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>ClickHouse SQL Dialect</span>
            <span>{displaySQL.split('\n').length} lines</span>
          </div>
        </div>
      }
      contentClassName={cn(
        'max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw]',
        isFullScreen && '!max-w-[98vw]'
      )}
      {...props}
    />
  )
})

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
