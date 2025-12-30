import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ChartEmptyProps {
  title?: string
  className?: string
  description?: string
  variant?: EmptyStateVariant
  onRetry?: () => void
  /** Use compact layout for smaller charts */
  compact?: boolean
}

export function ChartEmpty({
  title,
  className,
  description,
  variant = 'no-data',
  onRetry,
  compact = false,
}: ChartEmptyProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <EmptyState
          variant={variant}
          title={title}
          description={description}
          compact={compact}
          action={
            onRetry
              ? {
                  label: 'Retry',
                  onClick: onRetry,
                  icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
                }
              : undefined
          }
        />
      </CardContent>
    </Card>
  )
}
