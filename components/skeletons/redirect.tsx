/**
 * Redirect page skeleton
 *
 * Used for pages that immediately redirect to another location.
 * Shows a simple centered loading indicator.
 */

'use client'

import { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export interface RedirectSkeletonProps {
  /** Optional title for the skeleton */
  title?: string
  /** Optional description for the skeleton */
  description?: string
}

export const RedirectSkeleton = memo(function RedirectSkeleton({
  title,
  description,
}: RedirectSkeletonProps = {}) {
  return (
    <div
      className="flex h-screen items-center justify-center"
      role="status"
      aria-busy="true"
      aria-label={title || 'Loading...'}
    >
      <div className="w-full max-w-md space-y-4 px-4">
        {/* Title skeleton */}
        {title && <Skeleton className="h-8 w-48 sm:w-64" />}
        {!title && <Skeleton className="h-8 w-48 sm:w-64" />}

        {/* Content skeleton */}
        {description && <Skeleton className="h-4 w-64 sm:w-80" />}

        {/* Main content skeleton */}
        <Skeleton className="h-64 sm:h-96 w-full" />

        <span className="sr-only">{description || 'Loading content...'}</span>
      </div>
    </div>
  )
})
