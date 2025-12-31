/**
 * ErrorAlert Component
 *
 * Displays error messages with optional query details, stack traces, and retry functionality.
 * Automatically switches between compact and full variants based on props.
 *
 * @example
 * ```tsx
 * // Compact variant
 * <ErrorAlert title="Error" message="Something went wrong" compact />
 *
 * // Full variant with all features
 * <ErrorAlert
 *   title="Query Failed"
 *   message="Database connection error"
 *   query="SELECT * FROM table"
 *   errorType="query_error"
 *   reset={() => refetch()}
 * />
 * ```
 */

'use client'

import { memo } from 'react'

import type { ErrorAlertVariant } from './error-alert-variants'
import { CompactErrorAlert, FullErrorAlert } from './variants'
import type { ErrorAlertProps } from './types'
import { useErrorCountdown } from './use-error-countdown'

export type { ErrorAlertProps } from './types'
export type { ErrorAlertVariant } from './error-alert-variants'
export type { ErrorIconType } from './error-alert-icons'
export type { CompactErrorAlertProps } from './variants'
export type { FullErrorAlertProps } from './variants'

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
  const { countdown } = useErrorCountdown({
    onCountdownComplete: reset,
    initialSeconds: 30,
  })

  if (compact) {
    return (
      <CompactErrorAlert
        title={title}
        message={message}
        className={className}
        variant={variant}
      />
    )
  }

  return (
    <FullErrorAlert
      title={title}
      message={message}
      docs={docs}
      query={query}
      reset={reset}
      className={className}
      variant={variant}
      errorType={errorType}
      digest={digest}
      stack={stack}
      countdown={countdown}
    />
  )
})
