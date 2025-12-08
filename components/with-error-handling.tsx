import { ErrorAlert } from '@/components/error-alert'
import type { FetchDataError } from '@/lib/clickhouse'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
  getErrorVariant,
} from '@/lib/error-utils'

interface WithErrorHandlingProps {
  error?: FetchDataError | null
  query?: string
  children: React.ReactNode
}

/**
 * HOC component that handles error states consistently across the application.
 * Renders ErrorAlert for error states, otherwise renders children.
 */
export function WithErrorHandling({
  error,
  query,
  children,
}: WithErrorHandlingProps) {
  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
        query={query}
        variant={getErrorVariant(error)}
        errorType={error.type}
      />
    )
  }

  return <>{children}</>
}
