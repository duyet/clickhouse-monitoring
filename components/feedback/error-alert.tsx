'use client'

import { RefreshCwIcon } from 'lucide-react'
import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getEnvironment, shouldShowDetailedErrors } from '@/lib/env-utils'
import type { ErrorIconType } from './error-alert-icons'
import { getErrorIcon } from './error-alert-icons'
import {
  ErrorAlertAccordion,
  ErrorAlertDigest,
  ErrorAlertDocs,
} from './error-alert-accordion'
import type { ErrorAlertVariant } from './error-alert-variants'
import { getVariantStyles } from './error-alert-variants'
import { useErrorCountdown } from './use-error-countdown'

export interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  docs?: string | React.ReactNode | React.ReactNode[]
  query?: string
  reset?: () => void
  className?: string
  variant?: ErrorAlertVariant
  errorType?: ErrorIconType
  digest?: string
  stack?: string
  compact?: boolean
}

export const ErrorAlert = memo(function ErrorAlert({
  title = 'Something went wrong!',
  message = 'Checking console for more details.',
  docs,
  query,
  reset,
  className,
  variant = 'destructive',
  errorType,
  digest,
  stack,
  compact = false,
}: ErrorAlertProps) {
  const showDetails = shouldShowDetailedErrors()
  const environment = getEnvironment()
  const { countdown } = useErrorCountdown({
    onCountdownComplete: reset,
    initialSeconds: 30,
  })

  // Extract just the first line for compact mode
  const compactMessage =
    compact && typeof message === 'string' ? message.split('\n')[0] : message

  const renderContent = (
    content: string | React.ReactNode | React.ReactNode[]
  ) => (
    <div className="text-muted-foreground text-sm leading-relaxed">
      {typeof content === 'string' ? <div>{content}</div> : content}
    </div>
  )

  return (
    <div
      className={`${className} ${getVariantStyles(variant)} rounded-lg border ${compact ? 'p-2' : 'p-4'}`}
      data-testid="error-message"
      role="alert"
      aria-live="polite"
      aria-label={`Error: ${title}`}
    >
      <div className="flex items-start gap-3">
        {!compact && getErrorIcon(errorType)}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div
              className={`text-foreground ${compact ? 'text-sm' : 'font-medium'}`}
            >
              {title}
            </div>
            {!compact && showDetails && (
              <Badge variant="outline" className="text-xs">
                {environment}
              </Badge>
            )}
          </div>
          {message && !compact && renderContent(compactMessage)}
          {message && compact && (
            <div className="text-muted-foreground text-xs">
              {typeof compactMessage === 'string'
                ? compactMessage.substring(0, 50) +
                  (compactMessage.length > 50 ? '...' : '')
                : compactMessage}
            </div>
          )}

          {/* Development: Show stack trace */}
          {!compact &&
            showDetails &&
            stack &&
            <ErrorAlertAccordion title="Stack Trace" content={stack} />}

          {/* Always show query if available */}
          {Boolean(query) && (
            <ErrorAlertAccordion title="View Query Details" content={query} />
          )}

          {/* Show documentation */}
          {!compact && Boolean(docs) && <ErrorAlertDocs docs={docs} />}

          {/* Show error digest for tracking */}
          {!compact && digest && <ErrorAlertDigest digest={digest} />}

          {!compact && reset && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reset()}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Try again {countdown >= 0 && `(${countdown}s)`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
