'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ApiError } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface ChartErrorProps {
  error: Error | ApiError
  title?: string
  className?: string
  onRetry?: () => void
}

export function ChartError({
  error,
  title,
  className,
  onRetry,
}: ChartErrorProps) {
  const apiError = error as ApiError
  const isTableMissing = apiError.type === 'table_not_found'

  return (
    <Card className={cn('rounded-md border-destructive/50 bg-destructive/5', className)}>
      <CardHeader className="p-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            {title || 'Chart Error'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          {isTableMissing && (
            <p className="text-xs text-muted-foreground">
              This feature requires additional ClickHouse configuration.
            </p>
          )}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
