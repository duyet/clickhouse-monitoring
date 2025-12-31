/**
 * withSuspense - Higher-order component that wraps a page in Suspense
 *
 * This is needed for pages that use hooks which call useSearchParams()
 * (like useHostId()), because useSearchParams() must be wrapped in a
 * Suspense boundary.
 *
 * @example
 * ```tsx
 * import { withSuspense } from '@/components/layout/query-page'
 * import { myConfig } from '@/lib/query-config'
 * import { PageLayout } from '@/components/layout/query-page'
 *
 * function MyPageContent() {
 *   return <PageLayout queryConfig={myConfig} />
 * }
 *
 * export default withSuspense(MyPageContent)
 * ```
 */

'use client'

import { Suspense, type ComponentType } from 'react'
import { ChartSkeleton } from '@/components/skeletons'

export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <ChartSkeleton />
): ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  )

  WrappedComponent.displayName = `withSuspense(${
    Component.displayName || Component.name || 'Component'
  })`

  return WrappedComponent
}
