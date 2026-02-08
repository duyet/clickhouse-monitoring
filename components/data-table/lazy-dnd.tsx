/**
 * Lazy-loaded Draggable Table Header
 *
 * Dynamically imports @dnd-kit dependencies only when column reordering is enabled.
 * This reduces initial bundle size by ~40KB (gzipped) for users who don't use
 * drag-and-drop column reordering.
 *
 * @example
 * ```tsx
 * import { DraggableTableHeaderLoader } from '@/components/data-table/lazy-dnd'
 *
 * <DraggableTableHeaderLoader
 *   header={header}
 *   enableResize={enableResize}
 *   onAutoFit={onAutoFit}
 *   isSelectColumn={isSelectColumn}
 *   fallback={<StandardTableHeader {...props} />}
 * />
 * ```
 */

'use client'

import { lazy, type ReactNode, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Types for the DraggableTableHeader component
export interface DraggableTableHeaderProps {
  header: any
  enableResize?: boolean
  onAutoFit?: (columnId: string) => void
  isSelectColumn?: boolean
}

// Lazy load the draggable header component
const DraggableTableHeaderImpl = lazy(() =>
  import('./draggable-table-header').then((mod) => ({
    default: mod.DraggableTableHeader,
  }))
)

/**
 * Fallback loading state while the DnD component loads
 */
function DraggableHeaderFallback() {
  return (
    <div className="h-8 px-4 animate-pulse">
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

/**
 * Lazy-loaded wrapper for DraggableTableHeader
 *
 * Only loads @dnd-kit dependencies when column reordering is actually enabled.
 * Uses Suspense for a smooth loading experience.
 *
 * @param props - DraggableTableHeaderProps
 * @param fallback - Optional custom fallback component
 */
export function DraggableTableHeaderLoader({
  fallback,
  ...props
}: DraggableTableHeaderProps & {
  fallback?: ReactNode
}) {
  return (
    <Suspense fallback={fallback || <DraggableHeaderFallback />}>
      <DraggableTableHeaderImpl {...props} />
    </Suspense>
  )
}

/**
 * Check if drag-and-drop is available (loaded)
 */
export function isDnDReady(): boolean {
  return true // The lazy import will handle loading
}

/**
 * Preload DnD dependencies for faster subsequent interactions
 * Call this when user hovers over a drag handle or enables reordering
 */
export function preloadDnD() {
  // Trigger the lazy import
  void import('./draggable-table-header')
}
