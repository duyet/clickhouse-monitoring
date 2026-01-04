'use client'

import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { type ReactNode, Suspense } from 'react'
import { ChartError } from '@/components/charts/chart-error'
import { TableSkeleton } from '@/components/skeletons'

function defaultFallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  // Use ChartError for consistent error display across the app
  return <ChartError error={error} onRetry={resetErrorBoundary} />
}

export type ServerComponentLazyProps = {
  children: ReactNode
  fallback?: ReactNode
  onError?: null | ReactNode | ((props: FallbackProps) => ReactNode)
}

export function ServerComponentLazy({
  children,
  fallback = <TableSkeleton />,
  onError,
}: ServerComponentLazyProps) {
  let fallbackRender: (props: FallbackProps) => ReactNode

  if (onError === null) {
    fallbackRender = () => null
  } else if (typeof onError === 'function') {
    fallbackRender = onError
  } else if (onError !== undefined) {
    // onError is a ReactNode (string, number, element, etc.)
    fallbackRender = () => <div>{onError}</div>
  } else {
    fallbackRender = defaultFallbackRender
  }

  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}
