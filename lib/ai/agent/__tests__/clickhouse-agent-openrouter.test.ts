import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const openRouterChatMock = mock(() => ({ provider: 'openrouter-chat-model' }))
const openAIChatMock = mock(() => ({ provider: 'openai-chat-model' }))
const createOpenAIOptions: Array<Record<string, unknown>> = []

mock.module('server-only', () => ({}))
mock.module('@/lib/ai/agent/mcp-tool-adapter', () => ({
  createMcpTools: () => ({
    get_running_queries: { description: 'Mock tool' },
  }),
}))
mock.module('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: () => ({
    chat: openRouterChatMock,
  }),
}))
mock.module('@ai-sdk/openai', () => ({
  createOpenAI: (options: Record<string, unknown>) => {
    createOpenAIOptions.push(options)
    return {
      chat: openAIChatMock,
    }
  },
}))
describe('createClickHouseAgent OpenRouter model resolution', () => {
  const originalFallback = process.env.OPENROUTER_FREE_FALLBACK_MODEL
  const originalAnyRouterKey = process.env.ANYROUTER_API_KEY
  const originalAppName = process.env.APP_NAME
  const originalAppCategory = process.env.APP_CATEGORY
  const originalAppVersion = process.env.APP_VERSION

  beforeEach(() => {
    openRouterChatMock.mockClear()
    openAIChatMock.mockClear()
    createOpenAIOptions.length = 0
  })

  afterEach(() => {
    if (originalFallback) {
      process.env.OPENROUTER_FREE_FALLBACK_MODEL = originalFallback
    } else {
      delete process.env.OPENROUTER_FREE_FALLBACK_MODEL
    }
    if (originalAnyRouterKey) {
      process.env.ANYROUTER_API_KEY = originalAnyRouterKey
    } else {
      delete process.env.ANYROUTER_API_KEY
    }
    if (originalAppName) {
      process.env.APP_NAME = originalAppName
    } else {
      delete process.env.APP_NAME
    }
    if (originalAppCategory) {
      process.env.APP_CATEGORY = originalAppCategory
    } else {
      delete process.env.APP_CATEGORY
    }
    if (originalAppVersion) {
      process.env.APP_VERSION = originalAppVersion
    } else {
      delete process.env.APP_VERSION
    }
  })

  test('maps openrouter/free to fallback tool-capable model', async () => {
    process.env.OPENROUTER_FREE_FALLBACK_MODEL = 'openai/gpt-oss-20b:free'
    const { createClickHouseAgent } = await import('../clickhouse-agent')

    createClickHouseAgent({
      hostId: 0,
      model: 'openrouter/free',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: 'test-key',
    })

    expect(openRouterChatMock).toHaveBeenCalledWith(
      'openai/gpt-oss-20b:free',
      expect.any(Object)
    )
  })

  test('passes AnyRouter attribution headers to OpenAI-compatible provider', async () => {
    process.env.ANYROUTER_API_KEY = 'ar-test'
    process.env.APP_NAME = 'Agent Test'
    process.env.APP_CATEGORY = 'ops'
    process.env.APP_VERSION = 'test-version'
    const { resolveAgentChatModel } = await import('../provider-chat-model')

    resolveAgentChatModel({
      model: 'anyrouter:google/gemma-test',
      referer: 'https://example.test/agents',
    })

    expect(createOpenAIOptions[0]).toMatchObject({
      apiKey: 'ar-test',
      baseURL: 'https://anyrouter.dev/api/v1',
      headers: {
        'HTTP-Referer': 'https://example.test/agents',
        'X-AnyRouter-Title': 'Agent Test',
        'X-AnyRouter-Source': 'ops',
        'X-AnyRouter-Version': 'test-version',
      },
    })
    expect(createOpenAIOptions[0]).not.toHaveProperty('name')
    expect(openAIChatMock).toHaveBeenCalledWith('google/gemma-test')
  })
})
