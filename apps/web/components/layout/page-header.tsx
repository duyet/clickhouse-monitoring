import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * PageHeader — shared page-level heading block.
 *
 * Renders a flex row with:
 * - `title` at `text-xl font-semibold tracking-tight sm:text-2xl`
 * - optional `description` as `text-sm text-muted-foreground` below the title
 * - optional `actions` slot right-aligned via `ml-auto`
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <div className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
