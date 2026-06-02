import {
  extractMessageError,
  extractMessageUsage,
  getAgentMessageMetadata,
} from '../message-metadata'
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

  test('extracts structured answer errors from data-error parts', () => {
    const message = {
      id: 'msg-error',
      role: 'assistant' as const,
      parts: [
        {
          type: 'data-error',
          data: [
            {
              type: 'upstream_error',
              message: 'Every upstream failed',
              suggestion: 'Retry or switch model/provider',
              timestamp: 123,
              provider: 'openrouter',
              model: 'openrouter:openrouter/free',
            },
          ],
        },
      ],
    }

    expect(extractMessageError(message)).toMatchObject({
      type: 'upstream_error',
      message: 'Every upstream failed',
      provider: 'openrouter',
    })

    const metadata = getAgentMessageMetadata({ message })
    expect(metadata.messageError).toMatchObject({
      type: 'upstream_error',
      model: 'openrouter:openrouter/free',
    })
    expect(metadata.raw.error).toMatchObject({
      message: 'Every upstream failed',
    })
  })
})

describe('extractMessageUsage — resolvedModel field', () => {
  const makeUsagePart = (overrides: Record<string, unknown>) => ({
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
        estimatedCostUsd: 0,
        model: 'openrouter:openrouter/free',
        provider: 'openrouter',
        ...overrides,
      },
    ],
  })

  test('returns resolvedModel when present and is a string', () => {
    const message = {
      id: 'msg-resolved',
      role: 'assistant' as const,
      parts: [makeUsagePart({ resolvedModel: 'google/gemma-4-26b-it' })],
    }
    const usage = extractMessageUsage(message)
    expect(usage?.resolvedModel).toBe('google/gemma-4-26b-it')
  })

  test('returns undefined resolvedModel when not present in data', () => {
    const message = {
      id: 'msg-no-resolved',
      role: 'assistant' as const,
      parts: [makeUsagePart({})],
    }
    const usage = extractMessageUsage(message)
    expect(usage?.resolvedModel).toBeUndefined()
  })

  test('returns undefined resolvedModel when field is not a string', () => {
    const message = {
      id: 'msg-bad-resolved',
      role: 'assistant' as const,
      parts: [makeUsagePart({ resolvedModel: 42 })],
    }
    const usage = extractMessageUsage(message)
    expect(usage?.resolvedModel).toBeUndefined()
  })

  test('returns undefined resolvedModel when field is null', () => {
    const message = {
      id: 'msg-null-resolved',
      role: 'assistant' as const,
      parts: [makeUsagePart({ resolvedModel: null })],
    }
    const usage = extractMessageUsage(message)
    expect(usage?.resolvedModel).toBeUndefined()
  })

  test('resolvedModel is present in metadata usage when data-usage contains it', () => {
    const message = {
      id: 'msg-meta-resolved',
      role: 'assistant' as const,
      parts: [makeUsagePart({ resolvedModel: 'google/gemma-4-26b-it' })],
    }
    const metadata = getAgentMessageMetadata({ message })
    expect(metadata.usage?.resolvedModel).toBe('google/gemma-4-26b-it')
    expect(metadata.usage?.model).toBe('openrouter:openrouter/free')
  })

  test('resolvedModel equals model when they are the same value', () => {
    const message = {
      id: 'msg-same-resolved',
      role: 'assistant' as const,
      parts: [
        makeUsagePart({
          model: 'openrouter:some-model',
          resolvedModel: 'openrouter:some-model',
        }),
      ],
    }
    const usage = extractMessageUsage(message)
    expect(usage?.resolvedModel).toBe('openrouter:some-model')
    expect(usage?.model).toBe('openrouter:some-model')
  })
})
