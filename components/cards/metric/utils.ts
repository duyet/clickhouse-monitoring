import type { ApiError } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import type { EmptyStateVariant } from '@/components/ui/empty-state'
import type { MetricListItem } from './types'

export function getErrorVariant(error: Error | ApiError): EmptyStateVariant {
  const apiError = error as ApiError
  const message = error.message?.toLowerCase() ?? ''

  if (apiError.type === ApiErrorType.TableNotFound) return 'table-missing'
  if (apiError.type === ApiErrorType.NetworkError) return 'offline'
  if (message.includes('offline') || message.includes('network')) return 'offline'
  if (message.includes('timeout')) return 'timeout'
  return 'error'
}

export function getErrorDescription(error: Error | ApiError, variant: EmptyStateVariant): string {
  if (variant === 'offline') {
    return 'Unable to connect to the server. Check your network connection.'
  }
  if (variant === 'timeout') {
    return 'The query took too long to execute. Please try again.'
  }
  if (error.message && error.message.length < 200) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export function extractValue<T>(
  value: string | number | ((data: T[]) => string | number) | undefined,
  data: T[]
): string | number {
  if (typeof value === 'function') return value(data)
  return value ?? '-'
}

export function extractItems<T>(
  items: MetricListItem[] | ((data: T[]) => MetricListItem[]) | undefined,
  data: T[]
): MetricListItem[] {
  if (typeof items === 'function') return items(data)
  return items ?? []
}
