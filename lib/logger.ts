/**
 * Unified logging system for ClickHouse Monitor
 *
 * Environment-based behavior:
 * - Development: Full detailed logging with stack traces
 * - Production: Sanitized logging without sensitive data
 * - DEBUG=true: Forces debug/info output in any environment
 */

import { getEnvironment } from './env-utils'

// ============================================================================
// Environment Detection
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development'
const debugEnabled = process.env.DEBUG === 'true'

// ============================================================================
// Types
// ============================================================================

/**
 * Error logging context for additional metadata
 */
export interface ErrorContext {
  digest?: string
  component?: string
  action?: string
  userId?: string
  hostId?: number
  [key: string]: unknown
}

/**
 * Log entry metadata
 */
interface LogMetadata {
  timestamp: string
  environment: string
  level: LogLevel
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Debug logging - only in development or DEBUG=true
 *
 * @example
 * debug('[API] Query execution', { hostId: 0, query: 'SELECT 1' })
 */
export const debug = (message: string, data?: unknown): void => {
  if (isDevelopment || debugEnabled) {
    const metadata = createMetadata('debug')
    console.debug(`[DEBUG] ${metadata.timestamp}`, message, data || '')
  }
}

/**
 * Info logging - only in development or DEBUG=true
 *
 * @example
 * info('[API] Data fetched successfully', { rows: 100 })
 */
export const log = (message: string, data?: unknown): void => {
  if (isDevelopment || debugEnabled) {
    const metadata = createMetadata('info')
    console.log(`[INFO] ${metadata.timestamp}`, message, data || '')
  }
}

/**
 * Warning logging - always outputs
 *
 * @example
 * warn('[API] Deprecated endpoint accessed', { path: '/old-api' })
 */
export const warn = (message: string, data?: unknown): void => {
  const metadata = createMetadata('warn')
  if (isDevelopment) {
    console.warn(`[WARN] ${metadata.timestamp}:`, message, data || '')
  } else {
    console.warn(
      '[WARN]',
      JSON.stringify({ timestamp: metadata.timestamp, message, data })
    )
  }
}

/**
 * Error logging - always outputs
 *
 * @example
 * error('[API] Query failed:', err)
 * error('[API] Query failed with context:', err, { hostId: 0, query: 'SELECT 1' })
 */
export const error = (
  message: string,
  err?: Error | unknown,
  context?: ErrorContext
): void => {
  const metadata = createMetadata('error')

  if (isDevelopment) {
    // Development: Full detailed logging
    console.error('='.repeat(80))
    console.error(`[ERROR] ${metadata.timestamp} [${metadata.environment}]`)
    console.error('='.repeat(80))
    console.error('Message:', message)

    if (err instanceof Error) {
      console.error('Error Name:', err.name)
      console.error('Error Message:', err.message)
      if (err.stack) {
        console.error('Stack Trace:')
        console.error(err.stack)
      }
    } else if (err) {
      console.error('Error:', err)
    }

    if (context) {
      console.error('Context:', JSON.stringify(context, null, 2))
    }

    console.error('='.repeat(80))
  } else {
    // Production: Sanitized logging without stack traces
    const sanitizedLog = {
      timestamp: metadata.timestamp,
      environment: metadata.environment,
      message,
      error:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
            }
          : err,
      context: context
        ? {
            digest: context.digest,
            component: context.component,
            action: context.action,
            hostId: context.hostId,
          }
        : undefined,
    }

    console.error('[ERROR]', JSON.stringify(sanitizedLog))
  }
}

// ============================================================================
// Structured Error Logger Class
// ============================================================================

/**
 * Structured error logger for component-level error handling
 *
 * @example
 * ErrorLogger.logError(error, { component: 'Header', action: 'fetchHosts' })
 * ErrorLogger.logWarning('Cache miss', { key: 'hosts' })
 * ErrorLogger.logDebug('Rendering component', { props: { ... } })
 */
export class ErrorLogger {
  /**
   * Log an error with structured context
   * In development: logs full details including stack trace
   * In production: logs sanitized error without sensitive data
   */
  static logError(err: Error, context?: ErrorContext): void {
    const message = `Error in ${context?.component || 'unknown'}${context?.action ? ` (${context.action})` : ''}`
    error(message, err, context)
  }

  /**
   * Log a warning with context
   */
  static logWarning(message: string, context?: ErrorContext): void {
    warn(message, context)
  }

  /**
   * Log debug information (only in development)
   */
  static logDebug(message: string, data?: unknown): void {
    debug(message, data)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create log metadata with timestamp and environment
 */
function createMetadata(level: LogLevel): LogMetadata {
  return {
    timestamp: new Date().toISOString(),
    environment: getEnvironment(),
    level,
  }
}

/**
 * Format error for display based on environment
 * Returns user-friendly error messages for production display
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
  if (isDevelopment) {
    // In development, show full error details
    let detailedMessage = error.message

    // Extract backend error information if available
    if (
      error.message.includes('No ClickHouse hosts configured') ||
      error.message.includes('CLICKHOUSE_HOST')
    ) {
      detailedMessage =
        `Environment Configuration Error:\n\n${error.message}\n\n` +
        `This means the CLICKHOUSE_HOST environment variable is not set or empty.\n` +
        `Check your .env.local file or deployment environment settings.\n` +
        `See the browser console for detailed debug logs.`
    } else if (error.message.includes('Invalid hostId')) {
      detailedMessage = `Configuration Error: ${error.message}`
    } else if (
      error.message.includes('table') &&
      error.message.includes('not')
    ) {
      detailedMessage = `Database Error: ${error.message}`
    } else if (error.message.includes('Cannot read properties')) {
      detailedMessage = `Runtime Error: ${error.message}\n\nThis usually indicates a configuration issue or missing data.`
    }

    return {
      title: `Error: ${error.name}`,
      message: detailedMessage,
      details: {
        stack: error.stack,
        digest: error.digest,
        name: error.name,
      },
    }
  }

  // Production: More helpful message with error type hints
  let userMessage =
    'An unexpected error occurred. Please try again or contact support if the issue persists.'
  let adminNote = ''

  // Provide slightly more context in production without exposing sensitive details
  if (
    error.message.includes('No ClickHouse hosts configured') ||
    error.message.includes('CLICKHOUSE_HOST')
  ) {
    userMessage =
      'Server configuration error. The database connection is not properly configured. Please contact your administrator.'
    adminNote =
      'Note for administrator: No ClickHouse hosts configured. Please set CLICKHOUSE_HOST environment variable. Check deployment environment settings or Cloudflare Workers environment variables.'
  } else if (error.message.includes('Invalid hostId')) {
    userMessage =
      'Invalid server configuration. Please contact your administrator.'
    adminNote = `Note for administrator: ${error.message}`
  } else if (error.message.includes('table')) {
    userMessage =
      'A required database table is not available. Please contact your administrator.'
    adminNote = `Note for administrator: ${error.message}`
  } else if (
    error.message.includes('network') ||
    error.message.includes('connection')
  ) {
    userMessage =
      'Unable to connect to the database. Please check your network connection and try again.'
    adminNote = `Note for administrator: ${error.message}`
  }

  return {
    title: 'Something went wrong',
    message: adminNote ? `${userMessage}\n\n${adminNote}` : userMessage,
    details: {
      digest: error.digest,
    },
  }
}
