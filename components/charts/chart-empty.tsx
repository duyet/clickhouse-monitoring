import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ChartEmptyProps {
  title?: string
  className?: string
  description?: string
}

export function ChartEmpty({
  title = 'No data available',
  className,
  description,
}: ChartEmptyProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardContent className="p-8">
        <EmptyState
          variant="no-data"
          title={title}
          description={
            description ||
            'There is no data to display for this chart. This could be due to no activity in the selected time period or a configuration issue.'
          }
        />
      </CardContent>
    </Card>
  )
}
