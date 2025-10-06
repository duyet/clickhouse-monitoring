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
    try {
      ErrorLogger.logError(error, {
        digest: error.digest,
        component: 'ErrorBoundary',
      })
    } catch (logError) {
      // Fallback if logging fails
      console.error('Failed to log error:', logError)
      console.error('Original error:', error)
    }
  }, [error])

  let formattedError
  try {
    formattedError = formatErrorForDisplay(error)
  } catch (formatError) {
    // Fallback if formatting fails
    console.error('Failed to format error:', formatError)
    formattedError = {
      title: 'Something went wrong',
      message: error?.message || 'An unexpected error occurred',
      details: {
        digest: error?.digest,
      },
    }
  }

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
