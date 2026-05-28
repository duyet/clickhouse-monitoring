'use client'

import { AlertCircleIcon, CopyIcon, RefreshCwIcon, XIcon } from 'lucide-react'

import type { AgentError, AgentErrorType } from '@/lib/ai/agent/errors'

import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isAgentError, parseAgentError } from '@/lib/ai/agent/errors'
import { cn } from '@/lib/utils'

const ERROR_TYPE_LABELS: Record<AgentErrorType, string> = {
  auth_error: 'Auth Error',
  rate_limit: 'Rate Limited',
  billing_error: 'Billing',
  upstream_error: 'Upstream Error',
  model_error: 'Model Error',
  timeout: 'Timeout',
  network_error: 'Network Error',
  tool_error: 'Tool Error',
  unknown: 'Error',
}

const ERROR_TYPE_CLASSES: Record<AgentErrorType, string> = {
  auth_error:
    'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  rate_limit:
    'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  billing_error:
    'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  upstream_error:
    'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  model_error:
    'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  timeout:
    'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  network_error:
    'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  tool_error:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  unknown:
    'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

interface AgentErrorDisplayProps {
  readonly error: Error | AgentError
  readonly embedded?: boolean
  readonly onRetry?: () => void
  readonly onDismiss?: () => void
}

/**
 * Renders a structured, rich display of an agent error.
 *
 * Calls `parseAgentError(error)` to extract AgentError metadata and falls back
 * to plain `error.message` when structured metadata is unavailable.
 */
export function AgentErrorDisplay({
  error,
  embedded = false,
  onRetry,
  onDismiss,
}: AgentErrorDisplayProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const classified = isAgentError(error) ? error : parseAgentError(error)

  const errorType: AgentErrorType = classified?.type ?? 'unknown'
  const displayMessage = classified?.message ?? error.message
  const suggestion = classified?.suggestion
  const details = classified?.details
  const timestamp = classified?.timestamp
  const model = classified?.model
  const provider = classified?.provider
  const code = classified?.code
  const statusCode = classified?.statusCode
  const upstreamBackend = classified?.upstreamBackend
  const upstreamStatus = classified?.upstreamStatus
  const upstreamMessage = classified?.upstreamMessage
  const requestId = classified?.requestId
  const timestampDate = timestamp ? new Date(timestamp) : null
  const timestampLabel =
    timestampDate && !Number.isNaN(timestampDate.getTime())
      ? timestampDate.toLocaleString()
      : null

  const detailRows = [
    timestampLabel ? { label: 'Time', value: timestampLabel } : null,
    model ? { label: 'Model', value: model } : null,
    provider ? { label: 'Provider', value: provider } : null,
    code ? { label: 'Code', value: code } : null,
    statusCode ? { label: 'Status', value: String(statusCode) } : null,
    upstreamBackend
      ? { label: 'Upstream backend', value: upstreamBackend }
      : null,
    upstreamStatus
      ? { label: 'Upstream status', value: String(upstreamStatus) }
      : null,
    upstreamMessage
      ? { label: 'Upstream message', value: upstreamMessage }
      : null,
    requestId ? { label: 'Request ID', value: requestId } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row))
  const rawError = classified
    ? JSON.stringify(classified, null, 2)
    : error instanceof Error
      ? error.message
      : JSON.stringify(error, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawError)
      setCopied(true)
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
        copyTimerRef.current = null
      }, 2000)
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }

  return (
    <div
      className={cn(embedded ? 'mt-2' : 'shrink-0 border-t px-3 py-2 sm:px-4')}
    >
      <Alert
        variant="destructive"
        className={cn(
          'gap-2',
          embedded && 'border-destructive/30 bg-destructive/5 text-foreground'
        )}
      >
        <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
        <AlertDescription className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    'text-xs shrink-0',
                    ERROR_TYPE_CLASSES[errorType]
                  )}
                >
                  {ERROR_TYPE_LABELS[errorType]}
                </Badge>
                <span className="text-sm break-words">{displayMessage}</span>
              </div>
              {suggestion && (
                <p className="text-xs text-muted-foreground">{suggestion}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailsOpen(true)}
                className="h-7 text-xs"
              >
                Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs"
                title="Copy error details"
              >
                <CopyIcon className="size-3 mr-1" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  <RefreshCwIcon className="size-3 mr-1" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="size-7"
                  title="Dismiss"
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[88vh] max-w-[min(94vw,42rem)] overflow-hidden p-0">
          <DialogHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 text-left">
            <DialogTitle className="text-base tracking-tight">
              Agent error details
            </DialogTitle>
            <DialogDescription className="text-left text-xs leading-5">
              Provider, upstream, and request metadata for this failed response.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-auto px-5 py-4">
            <div className="space-y-2 rounded-lg border border-border/60 bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('text-xs', ERROR_TYPE_CLASSES[errorType])}>
                  {ERROR_TYPE_LABELS[errorType]}
                </Badge>
                <span className="text-sm font-medium">{displayMessage}</span>
              </div>
              {suggestion && (
                <p className="text-sm text-muted-foreground">{suggestion}</p>
              )}
            </div>

            {detailRows.length > 0 && (
              <div className="rounded-lg bg-muted/20 px-3">
                {detailRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex min-h-9 items-center justify-between gap-3 border-b border-border/40 py-2 last:border-b-0"
                  >
                    <span className="text-xs text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="min-w-0 truncate text-right font-mono text-xs">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {details && details !== displayMessage && (
              <div className="rounded-lg bg-muted/20 p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Details
                </div>
                <pre className="whitespace-pre-wrap break-words text-xs leading-5">
                  {details}
                </pre>
              </div>
            )}

            <div className="rounded-lg bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Raw error
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 gap-1.5 px-2.5 text-xs"
                >
                  <CopyIcon className="size-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-muted-foreground">
                {rawError}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
