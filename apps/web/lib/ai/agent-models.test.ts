import {
  DEFAULT_AGENT_MODEL,
  FALLBACK_AGENT_MODEL,
  getAllModelOptions,
  resolveDefaultAgentModel,
} from './agent-model-registry'
import { isFreeAgentModel } from './agent-models'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

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
  test('defaults to AnyRouter Gemma 4 26B and includes curated free models', () => {
    const options = getAllModelOptions()

    expect(DEFAULT_AGENT_MODEL).toBe('anyrouter:google/gemma-4-26b-a4b-it')
    expect(options).toContain('openrouter:openrouter/free')
    expect(options).toContain('anyrouter:z-ai/glm-4.7-flash')
    expect(options).toContain('anyrouter:google/gemini-3.1-flash-lite')
    expect(options).toContain('anyrouter:google/gemma-4-26b-a4b-it')
  })
})

describe('resolveDefaultAgentModel', () => {
  const originalAnyRouter = process.env.ANYROUTER_API_KEY
  const originalLLM = process.env.LLM_API_KEY
  const originalOpenRouter = process.env.OPENROUTER_API_KEY

  beforeEach(() => {
    delete process.env.ANYROUTER_API_KEY
    delete process.env.LLM_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  afterEach(() => {
    if (originalAnyRouter) process.env.ANYROUTER_API_KEY = originalAnyRouter
    if (originalLLM) process.env.LLM_API_KEY = originalLLM
    if (originalOpenRouter) process.env.OPENROUTER_API_KEY = originalOpenRouter
  })

  test('prefers AnyRouter Gemma when ANYROUTER_API_KEY is set', () => {
    process.env.ANYROUTER_API_KEY = 'ar-test'
    expect(resolveDefaultAgentModel()).toBe(DEFAULT_AGENT_MODEL)
  })

  test('falls back to openrouter/free when only LLM_API_KEY is set', () => {
    process.env.LLM_API_KEY = 'or-test'
    expect(resolveDefaultAgentModel()).toBe(FALLBACK_AGENT_MODEL)
  })

  test('falls back to openrouter/free when only OPENROUTER_API_KEY is set', () => {
    process.env.OPENROUTER_API_KEY = 'or-test'
    expect(resolveDefaultAgentModel()).toBe(FALLBACK_AGENT_MODEL)
  })
})
