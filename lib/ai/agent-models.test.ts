import { describe, expect, test } from 'bun:test'
import { isFreeAgentModel } from './agent-models'

describe('isFreeAgentModel', () => {
  test('recognizes OpenRouter free router and explicit free suffixes', () => {
    expect(isFreeAgentModel('openrouter/free')).toBe(true)
    expect(isFreeAgentModel('qwen/qwen3-coder:free')).toBe(true)
  })

  test('does not treat unknown pricing as free', () => {
    expect(isFreeAgentModel('openrouter/auto')).toBe(false)
    expect(isFreeAgentModel('minimax/minimax-m2.7')).toBe(false)
  })
})
