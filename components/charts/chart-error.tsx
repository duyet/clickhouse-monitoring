'use client'

import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { ApiErrorType, type ApiError } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface ChartErrorProps {
  error: Error | ApiError
  title?: string
  className?: string
  onRetry?: () => void
  /** Use compact layout for smaller charts */
  compact?: boolean
}

/**
 * Determine the appropriate variant based on error type
 */
function getErrorVariant(error: Error | ApiError): EmptyStateVariant {
  const apiError = error as ApiError
  const message = error.message?.toLowerCase() ?? ''

  // Check for table not found
  if (apiError.type === ApiErrorType.TableNotFound) return 'table-missing'

  // Check for network/connection errors
  if (apiError.type === ApiErrorType.NetworkError) return 'offline'
  if (message.includes('offline') || message.includes('network') || message.includes('fetch')) return 'offline'

  // Check for timeout in message
  if (message.includes('timeout') || message.includes('timed out')) return 'timeout'

  return 'error'
}

/**
 * Get user-friendly error description
 */
function getErrorDescription(error: Error | ApiError, variant: EmptyStateVariant): string {
  const apiError = error as ApiError

  // Use specific messages for known error types
  if (variant === 'table-missing') {
    return 'This feature requires additional ClickHouse configuration or the system table doesn\'t exist on this cluster.'
  }

  if (variant === 'timeout') {
    return 'The query took too long to execute. Try reducing the time range or simplifying your filters.'
  }

  if (variant === 'offline') {
    return 'Unable to connect to the server. Check your network connection and try again.'
  }

  // Fall back to the actual error message if available
  if (error.message && error.message.length < 200) {
    return error.message
  }

  return 'An unexpected error occurred while loading data. Please try again.'
}

export function ChartError({
  error,
  title,
  className,
  onRetry,
  compact = false,
}: ChartErrorProps) {
  const variant = getErrorVariant(error)
  const description = getErrorDescription(error, variant)

  return (
    <Card
      className={cn(
        'rounded-md',
        variant === 'error' && 'border-destructive/30 bg-destructive/5',
        variant === 'timeout' && 'border-warning/30 bg-warning/5',
        variant === 'offline' && 'border-warning/30 bg-warning/5',
        className
      )}
    >
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <EmptyState
          variant={variant}
          title={title || (variant === 'error' ? 'Failed to load' : undefined)}
          description={description}
          compact={compact}
          action={
            onRetry
              ? {
                  label: 'Retry',
                  onClick: onRetry,
                  icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
                }
              : undefined
          }
        />
      </CardContent>
    </Card>
  )
}
