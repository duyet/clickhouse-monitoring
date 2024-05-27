'use client'

import { ReactNode, Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

import { ErrorAlert } from '@/components/error-alert'
import { LoadingIcon } from '@/components/loading-icon'

function defaultFallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return <ErrorAlert message={error.message} reset={resetErrorBoundary} />
}

export type ServerComponentLazyProps = {
  children: ReactNode
  errorFallback?: null | string | number | ((props: FallbackProps) => ReactNode)
}

export function ServerComponentLazy({
  children,
  errorFallback,
}: ServerComponentLazyProps) {
  let fallbackRender: (props: FallbackProps) => ReactNode

  if (errorFallback === null) {
    fallbackRender = () => null
  } else if (
    typeof errorFallback === 'string' ||
    typeof errorFallback === 'number'
  ) {
    fallbackRender = () => <span>{errorFallback}</span>
  } else {
    fallbackRender = defaultFallbackRender
  }

  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <Suspense fallback={<LoadingIcon />}>{children}</Suspense>
    </ErrorBoundary>
  )
}
