import type React from 'react'

export type ErrorAlertVariant = 'default' | 'destructive' | 'warning' | 'info'

export type ErrorAlertType =
  | 'table_not_found'
  | 'permission_error'
  | 'network_error'
  | 'validation_error'
  | 'query_error'

export interface ErrorAlertProps {
  title?: string
  message?: string | React.ReactNode | React.ReactNode[]
  docs?: string | React.ReactNode | React.ReactNode[]
  query?: string
  reset?: () => void
  className?: string
  variant?: ErrorAlertVariant
  errorType?: ErrorAlertType
  digest?: string
  stack?: string
  compact?: boolean
}
