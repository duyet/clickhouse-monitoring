import { getAgentMessageMetadata } from '../message-metadata'
import { describe, expect, test } from 'bun:test'

describe('agent message metadata', () => {
  test('extracts usage, part counts, and tool durations', () => {
    const metadata = getAgentMessageMetadata({
      message: {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Result' },
          {
            type: 'tool-query',
            toolCallId: 'tool-1',
            state: 'output-available',
            output: { duration: 125, data: [] },
          },
          {
            type: 'data-usage',
            data: [
              {
                totalInputTokens: 10,
                totalOutputTokens: 5,
                totalTokens: 15,
                cacheReadTokens: 0,
                cacheWriteTokens: 0,
                reasoningTokens: 0,
                stepCount: 1,
                estimatedCostUsd: 0.00001,
                model: 'anyrouter:test/model',
                provider: 'anyrouter',
              },
            ],
          },
        ],
      },
      responseDurationMs: 500,
    })

    expect(metadata).toMatchObject({
      messageId: 'msg-1',
      partCount: 3,
      textPartCount: 1,
      dataPartCount: 1,
      toolCallCount: 1,
      totalToolDurationMs: 125,
    })
    expect(metadata.usage?.provider).toBe('anyrouter')
    expect(metadata.usage?.totalTokens).toBe(15)
    expect(metadata.tools[0]).toMatchObject({
      name: 'query',
      toolCallId: 'tool-1',
      durationMs: 125,
    })
  })

  test('returns no usage when a message has no usage data', () => {
    const metadata = getAgentMessageMetadata({
      message: {
        id: 'msg-no-usage',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Result only' }],
      },
    })

    expect(metadata.usage).toBeNull()
    expect(metadata.toolCallCount).toBe(0)
    expect(metadata.textPartCount).toBe(1)
  })

  test('keeps error tool metadata without inventing duration', () => {
    const metadata = getAgentMessageMetadata({
      message: {
        id: 'msg-tool-error',
        role: 'assistant',
        parts: [
          {
            type: 'tool-query',
            toolCallId: 'tool-error',
            state: 'error',
            errorText: 'Query failed',
          },
        ],
      },
    })

    expect(metadata.totalToolDurationMs).toBe(0)
    expect(metadata.tools[0]).toMatchObject({
      name: 'query',
      toolCallId: 'tool-error',
      state: 'error',
      error: 'Query failed',
    })
    expect(metadata.tools[0].durationMs).toBeUndefined()
  })

  test('sums multiple tool durations', () => {
    const metadata = getAgentMessageMetadata({
      message: {
        id: 'msg-multi-tool',
        role: 'assistant',
        parts: [
          {
            type: 'tool-query',
            toolCallId: 'tool-1',
            state: 'output-available',
            output: { duration: 75 },
          },
          {
            type: 'tool-schema',
            toolCallId: 'tool-2',
            state: 'output-available',
            output: { duration: 50 },
          },
        ],
      },
    })

    expect(metadata.toolCallCount).toBe(2)
    expect(metadata.totalToolDurationMs).toBe(125)
    expect(metadata.tools.map((tool) => tool.name)).toEqual(['query', 'schema'])
  })

  test('captures reasoning usage and reasoning part counts', () => {
    const metadata = getAgentMessageMetadata({
      message: {
        id: 'msg-reasoning',
        role: 'assistant',
        parts: [
          { type: 'reasoning', text: 'Need to inspect slow merges.' },
          {
            type: 'data-usage',
            data: [
              {
                totalInputTokens: 20,
                totalOutputTokens: 12,
                totalTokens: 32,
                cacheReadTokens: 2,
                cacheWriteTokens: 0,
                reasoningTokens: 6,
                stepCount: 2,
                estimatedCostUsd: null,
              },
            ],
          },
        ],
      },
    })

    expect(metadata.reasoningPartCount).toBe(1)
    expect(metadata.usage?.reasoningTokens).toBe(6)
    expect(metadata.usage?.stepCount).toBe(2)
  })

  test('counts text-only and data-only messages without tools', () => {
    const textOnly = getAgentMessageMetadata({
      message: {
        id: 'msg-text-only',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Only text' }],
      },
    })
    const dataOnly = getAgentMessageMetadata({
      message: {
        id: 'msg-data-only',
        role: 'assistant',
        parts: [
          {
            type: 'data-usage',
            data: [
              {
                totalInputTokens: 1,
                totalOutputTokens: 2,
                totalTokens: 3,
                cacheReadTokens: 0,
                cacheWriteTokens: 0,
                reasoningTokens: 0,
                stepCount: 1,
                estimatedCostUsd: 0,
              },
            ],
          },
        ],
      },
    })

    expect(textOnly).toMatchObject({
      partCount: 1,
      textPartCount: 1,
      dataPartCount: 0,
      toolCallCount: 0,
    })
    expect(dataOnly).toMatchObject({
      partCount: 1,
      textPartCount: 0,
      dataPartCount: 1,
      toolCallCount: 0,
    })
  })
})
