import { DEFAULT_AGENT_MODEL, getAllModelOptions } from './agent-model-registry'
import { isFreeAgentModel } from './agent-models'
import { describe, expect, test } from 'bun:test'

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

describe('AnyRouter model registry', () => {
  test('includes the curated AnyRouter models and default', () => {
    const options = getAllModelOptions()

    expect(DEFAULT_AGENT_MODEL).toBe('anyrouter:z-ai/glm-4.7-flash')
    expect(options).toContain('anyrouter:z-ai/glm-4.7-flash')
    expect(options).toContain('anyrouter:google/gemini-3.1-flash-lite')
    expect(options).toContain('anyrouter:google/gemma-4-26b-a4b-it')
  })
})
