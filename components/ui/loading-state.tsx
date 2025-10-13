/**
 * Loading state components for better UX
 * Provides consistent loading indicators across the application
 */

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Simple loading spinner component
 */
export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  }

  return (
    <Loader2
      className={cn(
        'text-muted-foreground animate-spin',
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  )
}

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Loading state with optional message
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-muted-foreground text-sm" aria-label={message}>
          {message}
        </p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Full overlay loading state
 */
export function LoadingOverlay({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'bg-background/80 absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

/**
 * Skeleton loading placeholder
 */
export function LoadingSkeleton({
  className,
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('bg-muted animate-pulse rounded-md', className)}
          role="status"
          aria-label="Loading content"
        />
      ))}
    </>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
  className?: string
}

/**
 * Table skeleton loading state
 */
export function LoadingTable({
  rows = 5,
  columns = 4,
  className,
}: LoadingTableProps) {
  return (
    <div
      className={cn('w-full space-y-2', className)}
      role="status"
      aria-label="Loading table"
    >
      {/* Header */}
      <div className="flex gap-2">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={`header-${index}`}
            className="bg-muted h-8 flex-1 animate-pulse rounded"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="bg-muted/50 h-12 flex-1 animate-pulse rounded"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface LoadingCardProps {
  className?: string
  includeHeader?: boolean
}

/**
 * Card skeleton loading state
 */
export function LoadingCard({
  className,
  includeHeader = true,
}: LoadingCardProps) {
  return (
    <div
      className={cn('bg-card rounded-lg border p-4 shadow-sm', className)}
      role="status"
      aria-label="Loading card"
    >
      {includeHeader && (
        <div className="mb-4 space-y-2">
          <div className="bg-muted h-5 w-1/3 animate-pulse rounded" />
          <div className="bg-muted/50 h-4 w-1/2 animate-pulse rounded" />
        </div>
      )}
      <div className="space-y-3">
        <div className="bg-muted/50 h-4 w-full animate-pulse rounded" />
        <div className="bg-muted/50 h-4 w-5/6 animate-pulse rounded" />
        <div className="bg-muted/50 h-4 w-4/6 animate-pulse rounded" />
      </div>
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  retry?: () => void
  className?: string
}

/**
 * Error state component
 */
export function ErrorState({
  message = 'An error occurred',
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'border-destructive/50 bg-destructive/10 flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-destructive/20 flex size-12 items-center justify-center rounded-full">
        <span className="text-destructive text-2xl" aria-hidden="true">
          ⚠
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-destructive font-medium">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="text-muted-foreground hover:text-foreground text-sm underline"
            aria-label="Retry loading"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * Empty state component
 */
export function EmptyState({
  message = 'No data available',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center',
        className
      )}
      role="status"
    >
      {icon && (
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">{message}</p>
        {action}
      </div>
    </div>
  )
}
