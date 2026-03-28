'use client'

import {
  AlertCircleIcon,
  ChevronDownIcon,
  CopyIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AgentError, AgentErrorType } from '@/lib/ai/agent/errors'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ERROR_TYPE_LABELS: Record<AgentErrorType, string> = {
  auth_error: 'Auth Error',
  rate_limit: 'Rate Limited',
  billing_error: 'Billing',
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
  readonly error: Error
  readonly onRetry?: () => void
  readonly onDismiss?: () => void
}

/**
 * Renders a structured, rich display of an agent error.
 *
 * Tries to parse `error.message` as JSON (AgentError); falls back to a plain
 * string representation when the message is not structured JSON.
 */
export function AgentErrorDisplay({
  error,
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

  // Attempt to parse as structured AgentError
  let classified: AgentError | null = null
  try {
    const parsed = JSON.parse(error.message) as AgentError
    if (parsed && typeof parsed.type === 'string' && typeof parsed.message === 'string') {
      classified = parsed
    }
  } catch {
    // Not JSON — use plain message
  }

  const errorType: AgentErrorType = classified?.type ?? 'unknown'
  const displayMessage = classified?.message ?? error.message
  const suggestion = classified?.suggestion
  const details = classified?.details
  const timestamp = classified?.timestamp
  const model = classified?.model
  const statusCode = classified?.statusCode

  const hasDetails = Boolean(details || timestamp || model || statusCode)

  const handleCopy = async () => {
    const text = classified
      ? JSON.stringify(classified, null, 2)
      : error.message
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silent fail
    }
  }

  return (
    <div className="px-3 sm:px-4 py-2 border-t shrink-0">
      <Alert variant="destructive" className="gap-2">
        <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
        <AlertDescription className="flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('text-xs shrink-0', ERROR_TYPE_CLASSES[errorType])}>
                  {ERROR_TYPE_LABELS[errorType]}
                </Badge>
                <span className="text-sm break-words">{displayMessage}</span>
              </div>
              {suggestion && (
                <p className="text-xs text-muted-foreground">{suggestion}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs"
                title="Copy error details"
              >
                <CopyIcon className="h-3 w-3 mr-1" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  <RefreshCwIcon className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="h-7 w-7"
                  title="Dismiss"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {hasDetails && (
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setDetailsOpen((v) => !v)}
              >
                <ChevronDownIcon
                  className={cn('h-3 w-3 transition-transform', {
                    'rotate-180': detailsOpen,
                  })}
                />
                {detailsOpen ? 'Hide details' : 'Show details'}
              </button>
              {detailsOpen && (
                <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs space-y-1 font-mono break-all">
                  {details && details !== displayMessage && (
                    <div>
                      <span className="text-muted-foreground">Details: </span>
                      {details}
                    </div>
                  )}
                  {timestamp && (
                    <div>
                      <span className="text-muted-foreground">Time: </span>
                      {new Date(timestamp).toLocaleString()}
                    </div>
                  )}
                  {model && (
                    <div>
                      <span className="text-muted-foreground">Model: </span>
                      {model}
                    </div>
                  )}
                  {statusCode && (
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      {statusCode}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
