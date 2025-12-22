'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import { ErrorActions } from './error-actions'
import { ErrorContent } from './error-content'
import { ErrorHeader } from './error-header'
import { getVariantStyles } from './error-utils'
import type { ErrorAlertProps } from './types'

const DEFAULT_TITLE = 'Something went wrong!'
const DEFAULT_MESSAGE = 'Checking console for more details.'
const DEFAULT_COUNTDOWN = 30

export function ErrorAlert({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
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
  const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN)

  // Auto-reset timer effect
  useEffect(() => {
    if (!reset) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          reset()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [reset])

  return (
    <div
      className={cn('rounded-lg border', compact ? 'p-2' : 'p-4', className)}
      style={getVariantStyles(variant) as React.CSSProperties}
      data-testid="error-message"
    >
      <div className="flex items-start gap-3">
        <ErrorHeader title={title} errorType={errorType} compact={compact} />
        <ErrorContent
          message={message}
          docs={docs}
          query={query}
          digest={digest}
          stack={stack}
          compact={compact}
        />
      </div>
      <ErrorActions
        onReset={reset}
        countdown={countdown}
        compact={compact}
      />
    </div>
  )
}
