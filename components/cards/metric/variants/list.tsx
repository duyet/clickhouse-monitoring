import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { extractItems } from '../utils'
import type { MetricListItem } from '../types'

interface RenderProps<T> {
  items: MetricListItem[] | ((data: T[]) => MetricListItem[]) | undefined
  data: T[]
  compact: boolean
}

export function renderListVariant<T>({
  items,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const resolvedItems = extractItems(items, data)

  return (
    <div className={cn('space-y-1.5', compact ? 'space-y-1' : '')}>
      {resolvedItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-1.5"
        >
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {item.label}
          </span>
          <div
            className={cn(
              'truncate font-semibold text-right',
              compact ? 'text-xs' : 'text-sm',
              item.format === 'mono' && 'font-mono tabular-nums',
              item.format === 'truncate' && cn(
                'max-w-[120px] sm:max-w-[140px]',
                compact && 'max-w-[100px] sm:max-w-[120px]'
              )
            )}
            title={String(item.value)}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
