'use client'

import type { ToolCallMessagePartComponent } from '@assistant-ui/react'

import {
  type AgentToolPart,
  ToolCallPart,
} from '@/components/agents/chat/tool-output'

/**
 * Maps an assistant-ui tool-call message part onto the project's rich
 * `ToolCallPart` renderer (collapsible chrome, query-insights / visualization
 * / diagnostics cards, CSV download, expand-table dialog, ask-user widget).
 *
 * Registered as the `tools.Fallback` component on `MessagePrimitive.Parts`,
 * so every tool call — regardless of name — gets the full custom treatment.
 */
export const ToolFallback: ToolCallMessagePartComponent = ({
  toolCallId,
  toolName,
  args,
  argsText,
  result,
  isError,
  status,
  addResult,
}) => {
  const hasResult = result !== undefined && result !== null
  const isRunning = status?.type === 'running'

  const state: AgentToolPart['state'] = isError
    ? 'output-error'
    : hasResult
      ? 'output-available'
      : isRunning
        ? 'output-streaming'
        : 'input-available'

  const part: AgentToolPart = {
    type: `tool-${toolName ?? 'unknown'}`,
    toolCallId,
    toolName: toolName ?? 'tool',
    state,
    input: args ?? (argsText ? safeParse(argsText) : undefined),
    output: result,
    errorText: isError
      ? typeof result === 'string'
        ? result
        : JSON.stringify(result)
      : undefined,
  }

  return (
    <ToolCallPart
      part={part}
      isMessageStreaming={isRunning}
      onToolResult={(_toolCallId, value) => addResult(value)}
    />
  )
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}
