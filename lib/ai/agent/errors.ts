/**
 * Agent error classification and formatting utilities.
 *
 * Provides structured error types, classification logic, and actionable
 * suggestions to improve the agent error UX.
 */

export type AgentErrorType =
  | 'auth_error' // 401, 403, invalid API key
  | 'rate_limit' // 429, quota exceeded
  | 'model_error' // Model not found, model overloaded
  | 'tool_error' // Tool execution failed
  | 'timeout' // Request/query timeout
  | 'network_error' // Connection refused, DNS failure
  | 'billing_error' // 402, insufficient credits
  | 'unknown' // Fallback

export interface AgentError {
  type: AgentErrorType
  message: string
  details?: string
  suggestion: string
  timestamp: number
  model?: string
  statusCode?: number
}

/**
 * Returns an actionable suggestion string for a given error type.
 */
export function getErrorSuggestion(type: AgentErrorType): string {
  switch (type) {
    case 'auth_error':
      return 'Check your LLM_API_KEY in .env.local'
    case 'rate_limit':
      return 'Wait a moment and retry, or switch to a different model'
    case 'billing_error':
      return 'Add credits to your OpenRouter account'
    case 'model_error':
      return 'Try a different model from the dropdown'
    case 'timeout':
      return 'Simplify your query or increase CLICKHOUSE_MAX_EXECUTION_TIME'
    case 'network_error':
      return 'Check your internet connection and LLM_API_BASE URL'
    case 'tool_error':
      return 'The tool encountered an issue. Try rephrasing your question'
    case 'unknown':
    default:
      return 'An unexpected error occurred. Try again or switch models'
  }
}

/**
 * Classifies an unknown error into a structured AgentError.
 *
 * Numeric HTTP status codes take priority over keyword matching so that
 * a response like "402 Payment Required" doesn't accidentally match the
 * 'auth_error' branch via the word "required".
 */
export function classifyError(error: unknown): AgentError {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? 'Unknown error')

  const lower = rawMessage.toLowerCase()

  // Extract the first HTTP status code present in the message (4xx/5xx).
  const statusMatch = rawMessage.match(/\b([45]\d{2})\b/)
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined

  let type: AgentErrorType = 'unknown'

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    lower.includes('unauthorized') ||
    /invalid.{0,20}key/i.test(rawMessage)
  ) {
    type = 'auth_error'
  } else if (
    statusCode === 402 ||
    lower.includes('payment') ||
    lower.includes('credit') ||
    lower.includes('billing') ||
    lower.includes('insufficient funds')
  ) {
    type = 'billing_error'
  } else if (
    statusCode === 429 ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit') ||
    lower.includes('quota')
  ) {
    type = 'rate_limit'
  } else if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('etimedout')
  ) {
    type = 'timeout'
  } else if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    type = 'network_error'
  } else if (
    lower.includes('model') &&
    (lower.includes('not found') ||
      lower.includes('unavailable') ||
      lower.includes('overloaded'))
  ) {
    type = 'model_error'
  } else if (lower.includes('tool') && (lower.includes('error') || lower.includes('failed'))) {
    type = 'tool_error'
  }

  const suggestion = getErrorSuggestion(type)

  // First line of the message is the user-facing summary; multi-line messages
  // (e.g. with stack traces embedded) are demoted to details.
  const message = rawMessage.split('\n')[0] || rawMessage

  const details =
    error instanceof Error && error.stack && error.stack !== rawMessage
      ? error.stack
      : rawMessage !== message
        ? rawMessage
        : undefined

  return {
    type,
    message,
    details,
    suggestion,
    timestamp: Date.now(),
    statusCode,
  }
}
