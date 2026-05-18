import type { UIMessage } from 'ai'
import type { AgentUsageStats } from './analytics'
import type { AgentError } from './errors'

export interface AgentMessageUsage extends AgentUsageStats {
  readonly model?: string
  readonly provider?: string
}

export interface AgentToolMetadata {
  readonly name: string
  readonly toolCallId?: string
  readonly state?: string
  readonly durationMs?: number
  readonly error?: string
}

export interface AgentMessageMetadata {
  readonly messageId: string
  readonly role: UIMessage['role']
  readonly partCount: number
  readonly textPartCount: number
  readonly toolCallCount: number
  readonly dataPartCount: number
  readonly reasoningPartCount: number
  readonly totalToolDurationMs: number
  readonly usage: AgentMessageUsage | null
  readonly tools: AgentToolMetadata[]
  readonly raw: Record<string, unknown>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isToolPart(part: unknown): boolean {
  if (!isObject(part) || typeof part.type !== 'string') return false
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-')
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function extractMessageUsage(
  message: UIMessage
): AgentMessageUsage | null {
  for (let index = message.parts.length - 1; index >= 0; index--) {
    const part = message.parts[index]
    if (!isObject(part) || part.type !== 'data-usage') continue

    const data = part.data
    if (Array.isArray(data) && data.length > 0 && isObject(data[0])) {
      const totalInputTokens = readNumber(data[0], 'totalInputTokens')
      const totalOutputTokens = readNumber(data[0], 'totalOutputTokens')
      const totalTokens = readNumber(data[0], 'totalTokens')
      const cacheReadTokens = readNumber(data[0], 'cacheReadTokens')
      const cacheWriteTokens = readNumber(data[0], 'cacheWriteTokens')
      const reasoningTokens = readNumber(data[0], 'reasoningTokens')
      const stepCount = readNumber(data[0], 'stepCount')
      const estimatedCostUsd = data[0].estimatedCostUsd

      if (
        totalInputTokens === null ||
        totalOutputTokens === null ||
        totalTokens === null ||
        cacheReadTokens === null ||
        cacheWriteTokens === null ||
        reasoningTokens === null ||
        stepCount === null ||
        !(
          estimatedCostUsd == null ||
          (typeof estimatedCostUsd === 'number' &&
            Number.isFinite(estimatedCostUsd))
        )
      ) {
        return null
      }

      return {
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        cacheReadTokens,
        cacheWriteTokens,
        reasoningTokens,
        stepCount,
        estimatedCostUsd: estimatedCostUsd ?? null,
        model: typeof data[0].model === 'string' ? data[0].model : undefined,
        provider:
          typeof data[0].provider === 'string' ? data[0].provider : undefined,
      }
    }
  }

  return null
}

export function extractToolMetadata(message: UIMessage): AgentToolMetadata[] {
  const tools: AgentToolMetadata[] = []

  for (const part of message.parts) {
    if (!isToolPart(part) || !isObject(part)) {
      continue
    }

    const record = part as Record<string, unknown>
    const output = isObject(record.output) ? record.output : null
    const toolName =
      typeof record.toolName === 'string'
        ? record.toolName
        : part.type.replace(/^tool-/, '')
    const duration =
      output && typeof output.duration === 'number' && output.duration > 0
        ? output.duration
        : undefined

    tools.push({
      name: toolName,
      toolCallId:
        typeof record.toolCallId === 'string' ? record.toolCallId : undefined,
      state: typeof record.state === 'string' ? record.state : undefined,
      durationMs: duration,
      error:
        typeof record.errorText === 'string'
          ? record.errorText
          : output && typeof output.error === 'string'
            ? output.error
            : undefined,
    })
  }

  return tools
}

export function getAgentMessageMetadata({
  message,
  responseDurationMs,
  error,
  followUpError,
}: {
  readonly message: UIMessage
  readonly responseDurationMs?: number
  readonly error?: AgentError | null
  readonly followUpError?: AgentError | null
}): AgentMessageMetadata {
  const tools = extractToolMetadata(message)
  const usage = extractMessageUsage(message)
  const partTypes = message.parts.map((part) =>
    isObject(part) && typeof part.type === 'string' ? part.type : 'unknown'
  )

  return {
    messageId: message.id,
    role: message.role,
    partCount: message.parts.length,
    textPartCount: partTypes.filter((type) => type === 'text').length,
    toolCallCount: tools.length,
    dataPartCount: partTypes.filter((type) => type.startsWith('data-')).length,
    reasoningPartCount: partTypes.filter((type) => type === 'reasoning').length,
    totalToolDurationMs: tools.reduce(
      (total, tool) => total + (tool.durationMs ?? 0),
      0
    ),
    usage,
    tools,
    raw: {
      messageId: message.id,
      role: message.role,
      responseDurationMs,
      partTypes,
      usage,
      tools,
      error,
      followUpError,
    },
  }
}
