import { getEnvironment, isDevelopment } from './env-utils'

/**
 * Error logging context for additional metadata
 */
export interface ErrorContext {
  digest?: string
  component?: string
  action?: string
  userId?: string
  [key: string]: unknown
}

/**
 * Structured error logger that respects environment settings
 */
export class ErrorLogger {
  /**
   * Log an error with structured context
   * In development: logs full details including stack trace
   * In production: logs sanitized error without sensitive data
   */
  static logError(error: Error, context?: ErrorContext): void {
    const timestamp = new Date().toISOString()
    const environment = getEnvironment()

    if (isDevelopment()) {
      // Development: Full detailed logging
      console.error('='.repeat(80))
      console.error(`[ERROR] ${timestamp} [${environment}]`)
      console.error('='.repeat(80))
      console.error('Message:', error.message)
      console.error('Name:', error.name)

      if (context?.digest) {
        console.error('Digest:', context.digest)
      }

      if (context) {
        console.error('Context:', JSON.stringify(context, null, 2))
      }

      if (error.stack) {
        console.error('Stack Trace:')
        console.error(error.stack)
      }

      console.error('='.repeat(80))
    } else {
      // Production: Sanitized logging without stack traces
      const sanitizedLog = {
        timestamp,
        environment,
        name: error.name,
        message: error.message,
        digest: context?.digest,
        component: context?.component,
      }

      console.error('[ERROR]', JSON.stringify(sanitizedLog))
    }
  }

  /**
   * Log a warning with context
   */
  static logWarning(message: string, context?: ErrorContext): void {
    const timestamp = new Date().toISOString()

    if (isDevelopment()) {
      console.warn(`[WARN] ${timestamp}:`, message)
      if (context) {
        console.warn('Context:', context)
      }
    } else {
      console.warn('[WARN]', JSON.stringify({ timestamp, message, context }))
    }
  }

  /**
   * Log debug information (only in development)
   */
  static logDebug(message: string, data?: unknown): void {
    if (isDevelopment()) {
      console.debug(`[DEBUG]`, message, data)
    }
  }
}

/**
 * Format error for display based on environment
 */
export function formatErrorForDisplay(error: Error & { digest?: string }): {
  title: string
  message: string
  details?: {
    stack?: string
    digest?: string
    name?: string
  }
} {
  if (isDevelopment()) {
    return {
      title: `Error: ${error.name}`,
      message: error.message,
      details: {
        stack: error.stack,
        digest: error.digest,
        name: error.name,
      },
    }
  }

  // Production: Generic message with tracking digest
  return {
    title: 'Something went wrong',
    message:
      'An unexpected error occurred. Please try again or contact support if the issue persists.',
    details: {
      digest: error.digest,
    },
  }
}
