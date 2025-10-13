'use client'

import '@/app/globals.css'
import { BugIcon, RefreshCwIcon } from 'lucide-react'
import { Inter } from 'next/font/google'
import { useEffect } from 'react'

import { ErrorLogger, formatErrorForDisplay } from '@/lib/error-logger'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
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
        component: 'GlobalErrorBoundary',
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
    <html>
      <body className={inter.className}>
        <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-primary mx-auto h-12 w-12" />
            <h1 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {formattedError.title}
            </h1>
            <p className="text-muted-foreground mt-4">
              {formattedError.message}
            </p>

            {/* Show stack trace in development */}
            {formattedError.details?.stack && (
              <div className="bg-muted/30 mt-6 rounded-lg border p-4 text-left">
                <div className="mb-2 flex items-center gap-2">
                  <BugIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Stack Trace:</span>
                </div>
                <pre className="text-muted-foreground max-h-64 overflow-auto text-xs">
                  <code>{formattedError.details.stack}</code>
                </pre>
              </div>
            )}

            {/* Show error digest for support */}
            {formattedError.details?.digest && (
              <div className="bg-muted/30 mt-4 rounded-lg border p-4 text-left">
                <div className="mb-2 flex items-center gap-2">
                  <BugIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Error ID (for support):
                  </span>
                </div>
                <code className="text-muted-foreground block font-mono text-xs break-all">
                  {formattedError.details.digest}
                </code>
              </div>
            )}

            <div className="mt-6">
              <button
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-xs transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                onClick={() => reset()}
              >
                <RefreshCwIcon className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
