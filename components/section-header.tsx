'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

/**
 * SectionHeader - Consistent section header with title, description, and actions
 *
 * Provides a standardized header pattern for sections throughout the application.
 * Used above charts, tables, and other content groups.
 *
 * Features:
 * - Truncated title to prevent overflow
 * - Optional description for context
 * - Action buttons area (refresh, export, etc.)
 * - Responsive layout
 * - Proper spacing
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Query Performance"
 *   description="Real-time query execution metrics"
 *   actions={<RefreshButton />}
 * />
 * ```
 */
export interface SectionHeaderProps {
  /** Section title (displayed prominently) */
  title: string
  /** Optional description or subtitle */
  description?: string
  /** Optional action buttons/controls (right-aligned) */
  actions?: React.ReactNode
  /** Additional CSS classes to apply */
  className?: string
}

export const SectionHeader = memo(function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 mb-6', className)}
    >
      {/* Title and description */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h2 className="text-xl font-semibold text-foreground truncate">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground truncate">
            {description}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {actions && (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
})
