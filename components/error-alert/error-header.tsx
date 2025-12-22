'use client'

import { Badge } from '@/components/ui'
import { getEnvironment, shouldShowDetailedErrors } from '@/lib/env-utils'
import { cn } from '@/lib/utils'

import { getErrorIcon } from './error-utils'
import type { ErrorAlertType } from './types'

interface ErrorHeaderProps {
  title: string
  errorType?: ErrorAlertType
  compact?: boolean
}

export function ErrorHeader({ title, errorType, compact }: ErrorHeaderProps) {
  const showDetails = shouldShowDetailedErrors()
  const environment = getEnvironment()

  return (
    <div className="flex items-center justify-between gap-2">
      <div className={cn('flex items-center gap-3')}>
        {!compact && getErrorIcon(errorType)}
        <div className={`text-foreground ${compact ? 'text-sm' : 'font-medium'}`}>
          {title}
        </div>
      </div>
      {!compact && showDetails && (
        <Badge variant="outline" className="text-xs">
          {environment}
        </Badge>
      )}
    </div>
  )
}
