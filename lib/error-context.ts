/**
 * Enhanced error handling with contextual information
 * Provides detailed error messages for better debugging
 */

/**
 * Error context for providing detailed information
 */
export type ErrorContext = {
  operation: string
  component?: string
  parameters?: Record<string, unknown>
  timestamp?: Date
  userId?: string
  hostId?: number | string
  queryId?: string
}

/**
 * Enhanced error class with context
 */
export class ContextualError extends Error {
  public readonly context: ErrorContext
  public readonly originalError?: Error
  public readonly timestamp: Date

  constructor(
    message: string,
    context: ErrorContext,
    originalError?: Error | unknown
  ) {
    super(message)
    this.name = 'ContextualError'
    this.context = {
      ...context,
      timestamp: context.timestamp ?? new Date(),
    }
    this.originalError =
      originalError instanceof Error ? originalError : undefined
    this.timestamp = new Date()

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextualError)
    }
  }

  /**
   * Get formatted error message with context
   */
  public getDetailedMessage(): string {
    const parts: string[] = [this.message]

    if (this.context.operation) {
      parts.push(`Operation: ${this.context.operation}`)
    }

    if (this.context.component) {
      parts.push(`Component: ${this.context.component}`)
    }

    if (this.context.hostId !== undefined) {
      parts.push(`Host ID: ${this.context.hostId}`)
    }

    if (this.context.queryId) {
      parts.push(`Query ID: ${this.context.queryId}`)
    }

    if (
      this.context.parameters &&
      Object.keys(this.context.parameters).length > 0
    ) {
      const paramsStr = JSON.stringify(this.context.parameters, null, 2)
      parts.push(`Parameters: ${paramsStr}`)
    }

    if (this.originalError) {
      parts.push(`Original Error: ${this.originalError.message}`)
    }

    return parts.join('\n')
  }

  /**
   * Convert to JSON for logging
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
      stack: this.stack,
    }
  }
}

/**
 * Create a contextual error with detailed information
 */
export function createContextualError(
  message: string,
  context: ErrorContext,
  originalError?: Error | unknown
): ContextualError {
  return new ContextualError(message, context, originalError)
}

/**
 * Wrap a function with contextual error handling
 */
export function withErrorContext<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context: Omit<ErrorContext, 'timestamp'>
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          throw createContextualError(
            error instanceof Error ? error.message : String(error),
            context,
            error
          )
        })
      }

      return result
    } catch (error) {
      throw createContextualError(
        error instanceof Error ? error.message : String(error),
        context,
        error
      )
    }
  }) as T
}

/**
 * Format error for user display
 */
export function formatErrorForUser(
  error: Error | ContextualError | unknown
): string {
  if (error instanceof ContextualError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(
  error: Error | ContextualError | unknown
): string {
  if (error instanceof ContextualError) {
    return error.getDetailedMessage()
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? 'No stack trace'}`
  }

  return String(error)
}

/**
 * Log error with context
 */
export function logError(
  error: Error | ContextualError | unknown,
  additionalContext?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const logMessage = formatErrorForLogging(error)

  console.error(`[${timestamp}] Error:`, logMessage)

  if (additionalContext && Object.keys(additionalContext).length > 0) {
    console.error(
      'Additional Context:',
      JSON.stringify(additionalContext, null, 2)
    )
  }

  if (error instanceof ContextualError) {
    console.error('Error Context:', JSON.stringify(error.context, null, 2))
  }
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'Unknown error occurred'
  }

  if (error instanceof ContextualError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'An unexpected error occurred'
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error: unknown, errorName: string): boolean {
  if (error instanceof Error) {
    return error.name === errorName
  }
  return false
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options

  let lastError: unknown
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
          context
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }
  }

  throw createContextualError(
    `Operation failed after ${maxRetries} retries`,
    context,
    lastError
  )
}
