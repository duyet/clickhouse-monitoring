import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const openRouterChatMock = mock(() => ({ provider: 'openrouter-chat-model' }))

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
  createOpenAI: () => ({
    chat: () => ({ provider: 'openai-chat-model' }),
  }),
}))
mock.module('ai', () => ({
  ToolLoopAgent: class ToolLoopAgent {
    id: string
    model: unknown
    tools: Record<string, unknown>
    constructor(config: {
      id: string
      model: unknown
      tools: Record<string, unknown>
    }) {
      this.id = config.id
      this.model = config.model
      this.tools = config.tools
    }
  },
  stepCountIs: (n: number) => n,
}))

describe('createClickHouseAgent OpenRouter model resolution', () => {
  const originalFallback = process.env.OPENROUTER_FREE_FALLBACK_MODEL

  beforeEach(() => {
    openRouterChatMock.mockClear()
  })

  afterEach(() => {
    if (originalFallback) {
      process.env.OPENROUTER_FREE_FALLBACK_MODEL = originalFallback
    } else {
      delete process.env.OPENROUTER_FREE_FALLBACK_MODEL
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
})
