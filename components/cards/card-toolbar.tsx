'use client'

import {
  Check,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Hash,
  Info,
  MoreHorizontal,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo, useCallback, useMemo, useState } from 'react'
import { format } from 'sql-formatter'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { dedent } from '@/lib/utils'

const SQL_BEAUTIFY_KEY = 'card-toolbar-sql-beautify'

/** Get initial beautify state from localStorage */
function getInitialBeautifyState(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = localStorage.getItem(SQL_BEAUTIFY_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

/** Save beautify state to localStorage */
function saveBeautifyState(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SQL_BEAUTIFY_KEY, String(value))
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

/**
 * Metadata type for CardToolbar - uses shared ApiResponseMetadata
 * with optional fields for flexibility
 */
export type CardToolbarMetadata = Partial<ApiResponseMetadata>

export interface CardToolbarProps {
  sql?: string
  data?: ChartDataPoint[] | Record<string, unknown>[]
  /** Query execution metadata */
  metadata?: CardToolbarMetadata
  /** Always show the button (not just on hover) */
  alwaysVisible?: boolean
}

/**
 * Copyable value component - displays a value that can be clicked to copy
 */
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

/**
 * CardToolbar - Dropdown menu for viewing request info and raw data
 *
 * Extracted as a standalone component for reuse in both ChartCard and ChartEmpty.
 */
export const CardToolbar = memo(function CardToolbar({
  sql,
  data,
  metadata,
  alwaysVisible = false,
}: CardToolbarProps) {
  const [showRequestInfo, setShowRequestInfo] = useState(false)
  const [showData, setShowData] = useState(false)
  const [isBeautified, setIsBeautified] = useState(getInitialBeautifyState)

  const handleBeautifyToggle = useCallback((checked: boolean) => {
    setIsBeautified(checked)
    saveBeautifyState(checked)
  }, [])

  const dataJson = useMemo(() => {
    return data ? JSON.stringify(data, null, 2) : null
  }, [data])

  const displaySql = useMemo(() => {
    if (!sql) return null
    return isBeautified ? formatSQL(sql) : dedent(sql)
  }, [sql, isBeautified])

  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check if we have metadata to show
  const hasMetadata =
    metadata &&
    (metadata.duration !== undefined ||
      metadata.rows !== undefined ||
      metadata.clickhouseVersion ||
      metadata.host ||
      metadata.queryId ||
      metadata.api)

  // Check if we have data to show
  const hasData = data && (Array.isArray(data) ? data.length > 0 : true)

  // Check if we have request info to show (metadata or SQL)
  const hasRequestInfo = hasMetadata || sql

  // Don't render if nothing to show
  if (!sql && !hasData && !hasMetadata) return null

  // Format duration for display
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Build full API URL for debugging
  const fullApiUrl = useMemo(() => {
    if (!metadata?.api) return null
    // api field already contains full URL with params
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return metadata.api.startsWith('http')
      ? metadata.api
      : `${baseUrl}${metadata.api}`
  }, [metadata?.api])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`size-5 ${
              alwaysVisible
                ? 'opacity-40 hover:opacity-100'
                : 'opacity-0 group-hover:opacity-40 hover:!opacity-100'
            } transition-opacity rounded-full`}
          >
            <MoreHorizontal className="size-3" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {hasRequestInfo && (
            <DropdownMenuItem
              onClick={() => setShowRequestInfo(true)}
              className="gap-2 text-[13px]"
            >
              <Info
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.5}
              />
              <span>Request Info</span>
            </DropdownMenuItem>
          )}
          {hasData && (
            <DropdownMenuItem
              onClick={() => setShowData(true)}
              className="gap-2 text-[13px]"
            >
              <Database
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.5}
              />
              <span>Raw Data</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Request Info Dialog (Metadata + SQL combined) */}
      <Dialog open={showRequestInfo} onOpenChange={setShowRequestInfo}>
        <DialogContent className="w-auto min-w-[550px] max-w-[800px] max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-medium">
              Request Info
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6 overflow-auto">
            {/* Metadata Section */}
            {hasMetadata && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Metadata
                </h3>
                <dl className="space-y-3 text-sm [&_dt]:min-w-[100px]">
                  {fullApiUrl && (
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <ExternalLink className="size-3.5" strokeWidth={1.5} />
                        API URL
                      </dt>
                      <dd className="min-w-0 flex-1 text-right">
                        <button
                          onClick={() => handleCopy(fullApiUrl)}
                          className="font-mono text-xs text-right truncate max-w-full hover:text-primary cursor-pointer transition-colors inline-flex items-center gap-1.5 group/copy"
                          title={`Click to copy: ${fullApiUrl}`}
                        >
                          <span className="truncate">
                            {metadata?.api || fullApiUrl}
                          </span>
                          <Copy
                            className="size-3 opacity-40 group-hover/copy:opacity-100 shrink-0 transition-opacity"
                            strokeWidth={1.5}
                          />
                        </button>
                      </dd>
                    </div>
                  )}
                  {metadata?.duration !== undefined && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <Clock className="size-3.5" strokeWidth={1.5} />
                        Duration
                      </dt>
                      <CopyableValue
                        value={formatDuration(metadata.duration)}
                      />
                    </div>
                  )}
                  {metadata?.rows !== undefined && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <Database className="size-3.5" strokeWidth={1.5} />
                        Rows
                      </dt>
                      <CopyableValue value={metadata.rows.toLocaleString()} />
                    </div>
                  )}
                  {metadata?.clickhouseVersion && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <Zap className="size-3.5" strokeWidth={1.5} />
                        Version
                      </dt>
                      <CopyableValue value={metadata.clickhouseVersion} />
                    </div>
                  )}
                  {metadata?.host && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <Server className="size-3.5" strokeWidth={1.5} />
                        Host
                      </dt>
                      <CopyableValue value={metadata.host} />
                    </div>
                  )}
                  {metadata?.queryId && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <Hash className="size-3.5" strokeWidth={1.5} />
                        Query ID
                      </dt>
                      <CopyableValue value={metadata.queryId} />
                    </div>
                  )}
                  {metadata?.status && metadata.status !== 'ok' && (
                    <div className="flex justify-between gap-6">
                      <dt className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <Info className="size-3.5" strokeWidth={1.5} />
                        Status
                      </dt>
                      <dd className="font-medium">
                        {metadata.status.replace(/_/g, ' ')}
                      </dd>
                    </div>
                  )}
                </dl>
                {metadata?.statusMessage && (
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    {metadata.statusMessage}
                  </p>
                )}
              </div>
            )}

            {/* SQL Section */}
            {displaySql && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    SQL Query
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles
                        className="size-3 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                      <span className="text-xs text-muted-foreground">
                        Beautify
                      </span>
                      <Switch
                        checked={isBeautified}
                        onCheckedChange={handleBeautifyToggle}
                        className="scale-75"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1.5 text-xs text-muted-foreground"
                      onClick={() => displaySql && handleCopy(displaySql)}
                    >
                      {copied ? (
                        <Check className="size-3" strokeWidth={1.5} />
                      ) : (
                        <Copy className="size-3" strokeWidth={1.5} />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <pre className="text-[13px] leading-relaxed font-mono bg-muted/50 p-4 rounded-lg overflow-auto max-h-[50vh]">
                  <code className="whitespace-pre-wrap break-words">
                    {displaySql}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Dialog */}
      <Dialog open={showData} onOpenChange={setShowData}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <DialogTitle className="text-base font-medium">
              Raw Data
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={() => dataJson && handleCopy(dataJson)}
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={1.5} />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.5} />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </DialogHeader>
          <pre className="text-[13px] leading-relaxed font-mono bg-muted/50 p-4 rounded-lg overflow-auto max-h-[60vh] border">
            {dataJson}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  )
})
