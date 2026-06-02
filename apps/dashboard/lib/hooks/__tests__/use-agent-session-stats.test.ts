import type { UIMessage } from 'ai'

import {
  getMessageStats,
  useAgentSessionStats,
} from '../use-agent-session-stats'
import { describe, expect, mock, test } from 'bun:test'

// Mock React's useMemo to just call the factory directly (no React needed).
// `mock.module('react')` is global AND persists across files in the aggregated
// `bun test` run, so we MUST spread the real module — otherwise every later
// test file loses `forwardRef`/`createContext`/etc. and breaks.
const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useMemo: (factory: () => unknown) => factory(),
}))

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

// ─── useAgentSessionStats ────────────────────────────────────────────

describe('useAgentSessionStats', () => {
  test('returns EMPTY_STATS for empty array', () => {
    const stats = useAgentSessionStats([])
    expect(stats.totalMessages).toBe(0)
    expect(stats.requestCount).toBe(0)
    expect(stats.responseCount).toBe(0)
    expect(stats.toolCallCount).toBe(0)
    expect(stats.totalInputTokens).toBe(0)
    expect(stats.totalOutputTokens).toBe(0)
    expect(stats.totalTokens).toBe(0)
    expect(stats.estimatedCostUsd).toBeNull()
    expect(stats.avgResponseTimeMs).toBeNull()
  })

  test('returns EMPTY_STATS for undefined input', () => {
    const stats = useAgentSessionStats(
      undefined as unknown as readonly UIMessage[]
    )
    expect(stats.totalMessages).toBe(0)
  })

  test('counts user and assistant messages', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there',
        parts: [{ type: 'text', text: 'Hi there' }],
      },
      {
        id: '3',
        role: 'user',
        content: 'How are you?',
        parts: [{ type: 'text', text: 'How are you?' }],
      },
    ]
    const stats = useAgentSessionStats(messages)
    expect(stats.totalMessages).toBe(3)
    expect(stats.requestCount).toBe(2)
    expect(stats.responseCount).toBe(1)
  })

  test('estimates tokens from text length (4 chars per token)', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello world!',
        parts: [{ type: 'text', text: 'Hello world!' }],
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi',
        parts: [{ type: 'text', text: 'Hi' }],
      },
    ]
    const stats = useAgentSessionStats(messages)
    // 'Hello world!' = 12 chars -> ceil(12/4) = 3
    expect(stats.totalInputTokens).toBe(3)
    // 'Hi' = 2 chars -> ceil(2/4) = 1
    expect(stats.totalOutputTokens).toBe(1)
    expect(stats.totalTokens).toBe(4)
  })

  test('handles messages without parts', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        parts: undefined as unknown as UIMessage['parts'],
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Response',
        parts: undefined as unknown as UIMessage['parts'],
      },
    ]
    const stats = useAgentSessionStats(messages)
    expect(stats.requestCount).toBe(1)
    expect(stats.responseCount).toBe(1)
    expect(stats.totalInputTokens).toBe(0)
    expect(stats.totalOutputTokens).toBe(0)
  })

  test('counts tool calls from assistant message parts', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        parts: [
          { type: 'text', text: 'Checking...' },
          {
            type: 'tool-call',
            toolCallId: 'tc1',
            toolName: 'query',
            args: '{}',
          },
          {
            type: 'tool-call',
            toolCallId: 'tc2',
            toolName: 'query',
            args: '{}',
          },
        ],
      },
    ]
    const stats = useAgentSessionStats(messages)
    expect(stats.toolCallCount).toBe(2)
  })

  test('uses server usage data from data-usage parts', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Response',
        parts: [
          { type: 'text', text: 'Response' },
          {
            type: 'data-usage',
            data: [
              {
                totalInputTokens: 100,
                totalOutputTokens: 200,
                totalTokens: 300,
                estimatedCostUsd: 0.05,
              },
            ],
          } as unknown as UIMessage['parts'][number],
        ],
      },
    ]
    const stats = useAgentSessionStats(messages)
    expect(stats.totalInputTokens).toBe(100)
    expect(stats.totalOutputTokens).toBe(200)
    expect(stats.totalTokens).toBe(300)
    expect(stats.estimatedCostUsd).toBe(0.05)
  })

  test('picks the latest data-usage from last assistant message', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'First',
        parts: [
          { type: 'text', text: 'First' },
          {
            type: 'data-usage',
            data: [
              {
                totalTokens: 50,
                totalInputTokens: 25,
                totalOutputTokens: 25,
              },
            ],
          } as unknown as UIMessage['parts'][number],
        ],
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Second',
        parts: [
          { type: 'text', text: 'Second' },
          {
            type: 'data-usage',
            data: [
              {
                totalTokens: 150,
                totalInputTokens: 75,
                totalOutputTokens: 75,
              },
            ],
          } as unknown as UIMessage['parts'][number],
        ],
      },
    ]
    const stats = useAgentSessionStats(messages)
    expect(stats.totalTokens).toBe(150)
  })

  test('ignores data-usage parts without totalTokens field', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Hi',
        parts: [
          { type: 'text', text: 'Hi' },
          {
            type: 'data-usage',
            data: [{ somethingElse: true }],
          } as unknown as UIMessage['parts'][number],
        ],
      },
    ]
    const stats = useAgentSessionStats(messages)
    // Falls back to text estimation: 'Hi' = 2 chars -> 1 token
    expect(stats.totalOutputTokens).toBe(1)
  })

  test('counts dynamic-tool and tool-* prefixed parts as tool calls', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        parts: [
          {
            type: 'dynamic-tool',
          } as unknown as UIMessage['parts'][number],
          {
            type: 'tool-invocation',
          } as unknown as UIMessage['parts'][number],
        ],
      },
    ]
    const stats = useAgentSessionStats(messages)
    expect(stats.toolCallCount).toBe(2)
  })
})

// ─── getMessageStats ────────────────────────────────────────────────

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
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'query',
          args: '{}',
        },
        {
          type: 'tool-call',
          toolCallId: 'tc-2',
          toolName: 'list_tables',
          args: '{}',
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
        } as unknown as UIMessage['parts'][number],
        {
          type: 'tool-invocation',
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
          args: '{}',
          output: { duration: 150, data: [] },
        },
        {
          type: 'tool-call',
          toolCallId: 'tc-2',
          toolName: 'query',
          args: '{}',
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
          args: '{}',
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
          args: '{}',
          output: 'just a string result',
        },
      ],
    } as unknown as UIMessage)
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(1)
    expect(stats.totalToolDurationMs).toBe(0)
  })

  test('handles tool call with array output (not an object)', () => {
    const msg = makeMessage({
      parts: [
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'query',
          args: '{}',
          output: [1, 2, 3],
        },
      ],
    } as unknown as UIMessage)
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(1)
    expect(stats.totalToolDurationMs).toBe(0)
  })

  test('handles tool call with no output property', () => {
    const msg = makeMessage({
      parts: [
        {
          type: 'tool-call',
          toolCallId: 'tc-1',
          toolName: 'query',
          args: '{}',
        },
      ],
    })
    const stats = getMessageStats(msg)
    expect(stats.toolCallCount).toBe(1)
    expect(stats.totalToolDurationMs).toBe(0)
  })
})
