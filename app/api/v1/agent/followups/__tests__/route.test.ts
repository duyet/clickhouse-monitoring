import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const generateTextMock = mock(async () => ({
  output: {
    suggestions: [
      'Which tables should I inspect next?',
      'Show the slowest queries for this table',
      'Check whether merges are blocked',
    ],
  },
}))
const outputObjectMock = mock((config: unknown) => config)
const capturedModelOptions: Array<Record<string, unknown>> = []

mock.module('server-only', () => ({}))
mock.module('ai', () => ({
  generateText: generateTextMock,
  Output: {
    object: outputObjectMock,
  },
}))
mock.module('@/lib/ai/agent/provider-chat-model', () => ({
  DEFAULT_MODEL: 'openrouter:openrouter/auto',
  resolveAgentChatModel: (options: Record<string, unknown>) => {
    capturedModelOptions.push(options)
    return {
      model: { provider: 'mock-model' },
      modelId: 'google/gemma-test',
      providerId: 'anyrouter',
    }
  },
}))

let POST: (request: Request) => Promise<Response>

beforeAll(async () => {
  const route = await import('../route')
  POST = route.POST
})

beforeEach(() => {
  generateTextMock.mockClear()
  outputObjectMock.mockClear()
  capturedModelOptions.length = 0
  process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'none'
  delete process.env.LLM_API_KEY
  delete process.env.OPENROUTER_API_KEY
  delete process.env.NVIDIA_API_KEY
  process.env.ANYROUTER_API_KEY = 'sk-ar-test'
})

describe('POST /api/v1/agent/followups', () => {
  function request(body: unknown) {
    return new Request('http://localhost:3000/api/v1/agent/followups', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  test('generates structured follow-up suggestions with AnyRouter model config', async () => {
    const response = await POST(
      request({
        model: 'anyrouter:google/gemma-4-26b-a4b-it',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Show slow queries' }],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Here are the slowest queries.' }],
          },
        ],
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.suggestions).toHaveLength(3)
    expect(capturedModelOptions[0]).toMatchObject({
      model: 'anyrouter:google/gemma-4-26b-a4b-it',
      hasTools: false,
    })
    expect(generateTextMock).toHaveBeenCalledTimes(1)
    expect(outputObjectMock).toHaveBeenCalledTimes(1)
  })

  test('returns empty suggestions without conversation text', async () => {
    const response = await POST(
      request({
        model: 'anyrouter:google/gemma-4-26b-a4b-it',
        messages: [],
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.suggestions).toEqual([])
    expect(generateTextMock).not.toHaveBeenCalled()
  })

  test('returns structured error metadata when generation fails', async () => {
    generateTextMock.mockImplementationOnce(async () => {
      throw {
        statusCode: 502,
        responseBody: JSON.stringify({
          error: {
            code: 'upstream_exhausted',
            message: 'Every upstream failed',
            metadata: {
              upstream_backend: 'cloudflare',
              upstream_status: 502,
              upstream_message: 'backend unavailable',
            },
          },
        }),
      }
    })

    const response = await POST(
      request({
        model: 'anyrouter:google/gemma-4-26b-a4b-it',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'What failed?' }],
          },
        ],
      })
    )
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error).toMatchObject({
      type: 'upstream_error',
      provider: 'anyrouter',
      code: 'upstream_exhausted',
      upstreamBackend: 'cloudflare',
      upstreamMessage: 'backend unavailable',
    })
  })
})
