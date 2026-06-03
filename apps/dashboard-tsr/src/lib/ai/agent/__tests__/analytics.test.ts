import type { AgentUsageStats } from '../analytics'

import {
  aggregateUsage,
  aggregateUsageWithCost,
  estimateCost,
  MODEL_PRICING,
} from '../analytics'
import { describe, expect, test } from 'bun:test'

const makeUsage = (
  overrides: Partial<AgentUsageStats> = {}
): AgentUsageStats => ({
  totalInputTokens: 1000,
  totalOutputTokens: 500,
  totalTokens: 1500,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  stepCount: 1,
  estimatedCostUsd: null,
  ...overrides,
})

describe('aggregateUsage', () => {
  test('returns zeros for empty steps array', () => {
    const result = aggregateUsage([])
    expect(result.totalInputTokens).toBe(0)
    expect(result.totalOutputTokens).toBe(0)
    expect(result.totalTokens).toBe(0)
    expect(result.stepCount).toBe(0)
    expect(result.estimatedCostUsd).toBeNull()
  })

  test('sums usage across multiple steps', () => {
    const steps = [
      { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
    ]
    const result = aggregateUsage(steps)
    expect(result.totalInputTokens).toBe(300)
    expect(result.totalOutputTokens).toBe(150)
    expect(result.totalTokens).toBe(450)
    expect(result.stepCount).toBe(2)
  })

  test('handles missing token fields gracefully', () => {
    const steps = [
      { inputTokens: 100 },
      { outputTokens: 50 },
    ] as unknown as Parameters<typeof aggregateUsage>[0]
    const result = aggregateUsage(steps)
    expect(result.totalInputTokens).toBe(100)
    expect(result.totalOutputTokens).toBe(50)
    expect(result.totalTokens).toBe(0)
  })

  test('aggregates cache and reasoning tokens', () => {
    const steps = [
      {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        inputTokenDetails: { cacheReadTokens: 200, cacheWriteTokens: 100 },
        outputTokenDetails: { reasoningTokens: 300 },
      },
    ]
    const result = aggregateUsage(steps)
    expect(result.cacheReadTokens).toBe(200)
    expect(result.cacheWriteTokens).toBe(100)
    expect(result.reasoningTokens).toBe(300)
  })
})

describe('estimateCost', () => {
  test('returns 0 for free models in pricing table', () => {
    const usage = makeUsage()
    expect(estimateCost(usage, 'openrouter/free')).toBe(0)
  })

  test('returns 0 for :free suffix models not in table', () => {
    const usage = makeUsage()
    expect(estimateCost(usage, 'some-unknown/model:free')).toBe(0)
  })

  test('returns null for unknown paid models', () => {
    const usage = makeUsage()
    expect(estimateCost(usage, 'unknown/model')).toBeNull()
  })

  test('strips provider prefix from provider:model format', () => {
    const usage = makeUsage({
      totalInputTokens: 1_000_000,
      totalOutputTokens: 1_000_000,
    })
    // openai/gpt-4o via OpenRouter: [2.5, 10]
    const cost = estimateCost(usage, 'openrouter:openai/gpt-4o')
    expect(cost).not.toBeNull()
    expect(cost!).toBeCloseTo(2.5 + 10, 4)
  })

  test('handles nvidia: prefix with unknown model', () => {
    const usage = makeUsage()
    expect(estimateCost(usage, 'nvidia:nvidia/unknown-model')).toBeNull()
  })

  test('calculates cost for paid models correctly', () => {
    const usage = makeUsage({
      totalInputTokens: 1_000_000,
      totalOutputTokens: 1_000_000,
    })
    // openai/gpt-4o: [2.5, 10] per million tokens
    const cost = estimateCost(usage, 'openai/gpt-4o')
    expect(cost).not.toBeNull()
    expect(cost!).toBeCloseTo(2.5 + 10, 4) // input + output cost
  })

  test('applies cache read discount (0.1x)', () => {
    const usage = makeUsage({
      totalInputTokens: 1_000_000,
      totalOutputTokens: 0,
      cacheReadTokens: 500_000,
      cacheWriteTokens: 0,
    })
    // openai/gpt-4o: input 2.5/M
    // Non-cached: 500k at 2.5/M = 1.25
    // Cache read: 500k at 2.5/M * 0.1 = 0.125
    const cost = estimateCost(usage, 'openai/gpt-4o')
    expect(cost!).toBeCloseTo(1.25 + 0.125, 4)
  })

  test('applies cache write surcharge (1.25x)', () => {
    const usage = makeUsage({
      totalInputTokens: 1_000_000,
      totalOutputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 1_000_000,
    })
    // openai/gpt-4o: input 2.5/M
    // Cache write: 1M at 2.5/M * 1.25 = 3.125
    const cost = estimateCost(usage, 'openai/gpt-4o')
    expect(cost!).toBeCloseTo(3.125, 4)
  })

  test('handles case-insensitive model names', () => {
    const usage = makeUsage({
      totalInputTokens: 1_000_000,
      totalOutputTokens: 1_000_000,
    })
    const costLower = estimateCost(usage, 'openai/gpt-4o')
    const costUpper = estimateCost(usage, 'OpenAI/GPT-4o')
    expect(costLower).toBe(costUpper)
  })

  test('MODEL_PRICING has entries for key models', () => {
    expect('openai/gpt-4o' in MODEL_PRICING).toBe(true)
    expect('anthropic/claude-3-5-sonnet' in MODEL_PRICING).toBe(true)
    expect('openrouter/free' in MODEL_PRICING).toBe(true)
  })
})

describe('aggregateUsageWithCost', () => {
  test('combines aggregation and cost estimation', () => {
    const steps = [{ inputTokens: 1000, outputTokens: 500, totalTokens: 1500 }]
    const result = aggregateUsageWithCost(steps, 'openai/gpt-4o')
    expect(result.totalInputTokens).toBe(1000)
    expect(result.totalOutputTokens).toBe(500)
    expect(result.estimatedCostUsd).not.toBeNull()
  })

  test('returns null cost for unknown model', () => {
    const steps = [{ inputTokens: 1000, outputTokens: 500, totalTokens: 1500 }]
    const result = aggregateUsageWithCost(steps, 'unknown/model')
    expect(result.estimatedCostUsd).toBeNull()
  })

  test('returns 0 cost for free model', () => {
    const steps = [{ inputTokens: 1000, outputTokens: 500, totalTokens: 1500 }]
    const result = aggregateUsageWithCost(steps, 'openrouter/free')
    expect(result.estimatedCostUsd).toBe(0)
  })
})
