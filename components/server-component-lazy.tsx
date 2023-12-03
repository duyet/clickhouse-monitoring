'use client'

import { ReactNode, Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { ErrorAlert } from '@/components/error-alert'
import { LoadingIcon } from '@/components/loading-icon'

function fallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return <ErrorAlert message={error.message} reset={resetErrorBoundary} />
}

export function ServerComponentLazy({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <Suspense fallback={<LoadingIcon />}>{children}</Suspense>
    </ErrorBoundary>
  )
}
