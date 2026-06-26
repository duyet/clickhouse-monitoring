/**
 * Structured logging wrapper for AI agent tool execution.
 *
 * Wraps each tool's `execute` function ONCE at agent-creation time to emit
 * a structured log entry on every tool call. Fields emitted:
 *   toolName, traceId (toolCallId), conversationId (sessionId), durationMs,
 *   resultCount, errorCategory
 *
 * Sensitive args are redacted before logging so passwords / SQL strings don't
 * leak into log aggregators.
 *
 * Usage:
 *   const tools = wrapToolsWithLogging(createAllTools(hostId), sessionId)
 */

import { log, error as logError } from '@chm/logger'

/** Keys whose values are redacted in logged args. */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'key',
  'auth',
  'authorization',
  'credential',
  'credentials',
])

/** Maximum length for a stringified arg value in logs. */
const MAX_ARG_LOG_LENGTH = 256

/**
 * Redact sensitive fields and truncate long strings in tool input args.
 */
function redactArgs(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input

  if (Array.isArray(input)) {
    return input.map(redactArgs)
  }

  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      result[k] = '[REDACTED]'
    } else if (typeof v === 'string' && v.length > MAX_ARG_LOG_LENGTH) {
      result[k] = `${v.slice(0, MAX_ARG_LOG_LENGTH)}…`
    } else if (typeof v === 'object' && v !== null) {
      // One level of nesting — keep keys, redact values recursively
      result[k] = redactArgs(v)
    } else {
      result[k] = v
    }
  }
  return result
}

/**
 * Count rows in the tool result for the `resultCount` field.
 * Returns undefined when the result doesn't look like a row set.
 */
function countResults(result: unknown): number | undefined {
  if (Array.isArray(result)) return result.length
  if (typeof result === 'object' && result !== null) {
    const r = result as Record<string, unknown>
    if (Array.isArray(r.data)) return r.data.length
    if (Array.isArray(r.rows)) return r.rows.length
  }
  return undefined
}

/**
 * Classify an error into a short category string for structured logs.
 */
function classifyToolError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout'
    if (msg.includes('validation') || msg.includes('invalid'))
      return 'validation'
    if (msg.includes('not found') || msg.includes('does not exist'))
      return 'not_found'
    if (msg.includes('network') || msg.includes('connection')) return 'network'
    return 'error'
  }
  return 'unknown'
}

/** Minimal tool shape we need to wrap. */
interface WrappableTool {
  execute: (input: unknown, options: { toolCallId: string }) => unknown
  [key: string]: unknown
}

type ToolRecord = Record<string, WrappableTool>

/**
 * Return a new tools record where each tool's `execute` is wrapped with
 * structured logging. The original tool objects are not mutated.
 *
 * @param tools      - Tool record from `createAllTools`.
 * @param sessionId  - Agent session / conversation identifier for log correlation.
 */
export function wrapToolsWithLogging<T extends ToolRecord>(
  tools: T,
  sessionId: string
): T {
  const wrapped: Record<string, unknown> = {}

  for (const [toolName, tool] of Object.entries(tools)) {
    if (typeof tool.execute !== 'function') {
      wrapped[toolName] = tool
      continue
    }

    const originalExecute = tool.execute.bind(tool)

    wrapped[toolName] = {
      ...tool,
      execute: async (
        input: unknown,
        options: { toolCallId: string; abortSignal?: AbortSignal }
      ) => {
        const traceId = options?.toolCallId ?? crypto.randomUUID()
        const startMs = Date.now()

        try {
          const result = await originalExecute(input, options)
          const durationMs = Date.now() - startMs
          const resultCount = countResults(result)

          log('[agent:tool] completed', {
            toolName,
            traceId,
            conversationId: sessionId,
            durationMs,
            ...(resultCount !== undefined ? { resultCount } : {}),
            args: redactArgs(input),
          })

          return result
        } catch (err) {
          const durationMs = Date.now() - startMs
          const errorCategory = classifyToolError(err)

          logError('[agent:tool] failed', err, {
            component: 'agent-tool',
            action: toolName,
          })

          log('[agent:tool] execution-error', {
            toolName,
            traceId,
            conversationId: sessionId,
            durationMs,
            errorCategory,
            args: redactArgs(input),
          })

          throw err
        }
      },
    }
  }

  return wrapped as T
}
