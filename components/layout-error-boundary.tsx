'use client'

import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'
import { ErrorLogger } from '@/lib/error-logger'

/**
 * Error boundary fallback for layout-level errors
 * Provides a clean recovery UI when a page component crashes
 */
function LayoutErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="bg-destructive/10 flex size-16 items-center justify-center rounded-full">
          <AlertTriangleIcon className="text-destructive h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>
        <Button onClick={resetErrorBoundary} className="gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

/**
 * Layout-level error boundary wrapper
 * Catches errors in page components and provides recovery UI
 */
export function LayoutErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={LayoutErrorFallback}
      onError={(error) => {
        ErrorLogger.logError(error, { component: 'LayoutErrorBoundary', action: 'caught' })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
