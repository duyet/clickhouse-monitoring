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
  fallback?: ReactNode
  onError?: null | ReactNode | ((props: FallbackProps) => ReactNode)
}

export function ServerComponentLazy({
  children,
  fallback = <LoadingIcon />,
  onError,
}: ServerComponentLazyProps) {
  let fallbackRender: (props: FallbackProps) => ReactNode

  if (onError === null) {
    fallbackRender = () => null
  } else if (
    typeof onError === 'string' ||
    typeof onError === 'number'
  ) {
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
