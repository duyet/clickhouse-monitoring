import type { UIMessage } from 'ai'
import type { AgentUsageStats } from '@/lib/ai/agent/analytics'

import { getMessageStats } from '../use-agent-session-stats'
import { describe, expect, test } from 'bun:test'

// extractStats and extractUsageFromDataParts are not exported,
// but getMessageStats is. We test the exported surface.

function makeMessage(overrides: Partial<UIMessage> = {}): UIMessage {
  return {
    id: 'msg-1',
    role: 'assistant',
    content: '',
    parts: [],
    createdAt: new Date(),
    ...overrides,
  }
}

describe('getMessageStats', () => {
  test('returns zeros for message with no tool calls', () => {
    const msg = makeMessage({
      parts: [{ type: 'text', text: 'Hello' }],
    })
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(0)
    expect(stats.totalToolDurationMs).toBe(0)
  })

  test('counts tool-call parts', () => {
    const msg = makeMessage({
      parts: [
        { type: 'text', text: 'Running query...' },
        { type: 'tool-call', toolCallId: 'tc-1', toolName: 'query', input: {} },
        {
          type: 'tool-call',
          toolCallId: 'tc-2',
          toolName: 'list_tables',
          input: {},
        },
      ],
    })
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(2)
  })

  test('counts dynamic-tool and tool-* parts', () => {
    const msg = makeMessage({
      parts: [
        {
          type: 'dynamic-tool',
          toolCallId: 'tc-1',
          toolName: 'query',
          input: {},
        } as unknown as UIMessage['parts'][number],
        {
          type: 'tool-invocation',
          toolCallId: 'tc-2',
          toolName: 'list_tables',
          input: {},
        } as unknown as UIMessage['parts'][number],
      ],
    })
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(2)
  })

  test('sums duration from tool output', () => {
    const msg = makeMessage({
      parts: [
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'query',
          input: {},
          output: { duration: 150, data: [] },
        },
        {
          type: 'tool-call',
          toolCallId: 'tc-2',
          toolName: 'query',
          input: {},
          output: { duration: 300, data: [] },
        },
      ],
    } as unknown as UIMessage)
    const stats = getMessageStats(msg)
    expect(stats.totalToolDurationMs).toBe(450)
  })

  test('ignores non-positive durations', () => {
    const msg = makeMessage({
      parts: [
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'query',
          input: {},
          output: { duration: -10, data: [] },
        },
      ],
    } as unknown as UIMessage)
    const stats = getMessageStats(msg)
    expect(stats.totalToolDurationMs).toBe(0)
  })

  test('handles tool output without duration', () => {
    const msg = makeMessage({
      parts: [
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'query',
          input: {},
          output: 'just a string result',
        },
      ],
    } as unknown as UIMessage)
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(1)
    expect(stats.totalToolDurationMs).toBe(0)
  })
})
