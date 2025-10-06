'use client'

import { useEffect } from 'react'

import { ErrorAlert } from '@/components/error-alert'
import { ErrorLogger, formatErrorForDisplay } from '@/lib/error-logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error with structured logging
    ErrorLogger.logError(error, {
      digest: error.digest,
      component: 'ErrorBoundary',
    })
  }, [error])

  const formattedError = formatErrorForDisplay(error)

  return (
    <ErrorAlert
      title={formattedError.title}
      message={formattedError.message}
      digest={formattedError.details?.digest}
      stack={formattedError.details?.stack}
      reset={reset}
      variant="destructive"
    />
  )
}
