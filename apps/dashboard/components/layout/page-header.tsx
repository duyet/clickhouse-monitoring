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
 * On phones the title block and the actions stack vertically so the
 * description gets the full width (instead of being squeezed into a narrow
 * column that wraps one word per line) and the action buttons never overflow
 * off-screen. From `sm:` up they sit on one row with actions right-aligned.
 * - `title` at `text-xl font-semibold tracking-tight sm:text-2xl`
 * - optional `description` as `text-sm text-muted-foreground` below the title
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="min-w-0 sm:flex-1">
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
