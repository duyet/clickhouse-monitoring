import { cn } from '@/lib/utils'
import { FileQuestion, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from './button'

type EmptyStateVariant = 'no-data' | 'error' | 'loading'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
}

export function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const defaultConfig = {
    'no-data': {
      icon: icon || <FileQuestion className="h-12 w-12 text-muted-foreground/50" />,
      title: title || 'No data found',
      description:
        description ||
        'There are no results to display. Try adjusting your filters or check back later.',
    },
    error: {
      icon: icon || <AlertCircle className="h-12 w-12 text-destructive/50" />,
      title: title || 'Something went wrong',
      description:
        description ||
        'An error occurred while loading data. Please try again.',
    },
    loading: {
      icon: icon || <RefreshCw className="h-12 w-12 text-muted-foreground/50 animate-spin" />,
      title: title || 'Loading...',
      description: description || 'Please wait while we fetch your data.',
    },
  }

  const config = defaultConfig[variant]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {config.description}
      </p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  )
}
