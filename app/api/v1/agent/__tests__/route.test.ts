import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES } from '@/lib/ai/agent/json-render-catalog'
import { AGENT_JSON_RENDER_INLINE_PROMPT } from '@/lib/ai/agent/json-render-inline-prompt'
import { createJsonRenderPatchGuardStream } from '@/lib/ai/agent/json-render-patch-guard'

mock.module('server-only', () => ({}))

type AgentStreamResult = {
  toUIMessageStream: () => unknown
  consumeStream: () => Promise<void>
}

type CapturedAIArgs = {
  executeCalled: boolean
  pipeResultType: string
  mergedChunk?: unknown
  writtenChunks: unknown[]
  responseHeaders?: Headers
  originalMessageCount?: number
}

const capturedAgentArgs: Array<Record<string, unknown>> = []
const capturedAIArgs: CapturedAIArgs[] = []
let mockClerkUserId: string | null = null
let mockAgentStreamError: unknown = null

mock.module('@/lib/ai/agent', () => ({
  createClickHouseAgent: (options: Record<string, unknown>) => {
    capturedAgentArgs.push(options)

    return {
      stream: async (options: {
        onStepFinish: (step: {
          usage: { inputTokens: number; outputTokens: number }
        }) => void
      }) => {
        if (mockAgentStreamError) {
          throw mockAgentStreamError
        }

        options.onStepFinish({
          usage: {
            inputTokens: 3,
            outputTokens: 4,
          },
        })

        return {
          toUIMessageStream: () => ({
            pipeThrough: (_: unknown) => 'mocked-piped-stream',
          }),
          consumeStream: async () => {},
        } as AgentStreamResult
      },
    }
  },
}))

mock.module('ai', () => {
  let activeRecord: CapturedAIArgs | null = null

  return {
    convertToModelMessages: async (messages: unknown[]) => messages,
    isTextUIPart: (part: unknown) =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text',
    pipeJsonRender: (stream: unknown) => {
      if (activeRecord) {
        activeRecord.pipeResultType = typeof stream
      }

      return stream
    },
    createUIMessageStream: async ({
      execute,
      originalMessages,
    }: {
      execute: (params: {
        writer: { merge: (value: unknown) => void }
      }) => Promise<void> | void
      originalMessages?: unknown[]
    }) => {
      activeRecord = {
        executeCalled: false,
        pipeResultType: 'none',
        writtenChunks: [],
        originalMessageCount: originalMessages?.length ?? 0,
      }
      const record = activeRecord

      const writer = {
        merge: (value: unknown) => {
          record.mergedChunk = value
        },
        write: (value: unknown) => {
          record.writtenChunks.push(value)
        },
      }

      capturedAIArgs.push(record)
      await execute({ writer })
      record.executeCalled = true

      return { mergedChunk: record.mergedChunk }
    },
    createUIMessageStreamResponse: ({
      headers,
      stream,
    }: {
      headers?: HeadersInit
      stream?: unknown
    }) => {
      const responseHeaders = new Headers(headers)
      if (activeRecord) {
        activeRecord.responseHeaders = responseHeaders
      }

      return new Response(`mocked stream: ${typeof stream}`, {
        status: 200,
        headers: {
          'content-type': 'text/event-stream',
          ...Object.fromEntries(responseHeaders.entries()),
        },
      })
    },
  }
})

mock.module('@clerk/nextjs/server', () => ({
  auth: async () => ({
    userId: mockClerkUserId,
  }),
}))

describe('POST /api/v1/agent', () => {
  const AGENT_API_TOKEN = 'test-agent-token'

  const createAgentRequest = (init: RequestInit) => {
    const headers = new Headers(init.headers)
    headers.set('authorization', `Bearer ${AGENT_API_TOKEN}`)

    return new Request('http://localhost:3000/api/v1/agent', {
      ...init,
      headers,
    })
  }

  let POST: (request: Request) => Promise<Response>

  beforeAll(async () => {
    process.env.AGENT_API_TOKEN = AGENT_API_TOKEN
    const route = await import('../route')
    POST = route.POST
  })

  beforeEach(() => {
    capturedAgentArgs.length = 0
    capturedAIArgs.length = 0
    mockClerkUserId = null
    mockAgentStreamError = null
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    delete process.env.CHM_FEATURE_AGENT_ACCESS
    delete process.env.ANYROUTER_API_KEY
    process.env.LLM_API_KEY = 'test-llm-key'
    process.env.LLM_MODEL = 'openrouter:openrouter/auto'
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
  })

  async function readJsonRenderStreamValues(
    stream: unknown
  ): Promise<unknown[]> {
    if (!stream || typeof stream !== 'object' || !('getReader' in stream)) {
      return []
    }

    const reader = (stream as ReadableStream).getReader()
    const values: unknown[] = []
    const maxChunks = 1000
    const chunkTimeoutMs = 1500

    try {
      while (true) {
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        const timeout = new Promise<ReadableStreamReadResult<unknown>>(
          (_resolve, reject) => {
            timeoutId = setTimeout(() => {
              reject(
                new Error(
                  'Reading stream timed out while validating json-render guard.'
                )
              )
            }, chunkTimeoutMs)
          }
        )

        let result: ReadableStreamReadResult<unknown>
        try {
          result = (await Promise.race([
            reader.read(),
            timeout,
          ])) as ReadableStreamReadResult<unknown>
        } catch (error) {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          try {
            await reader.cancel('read timeout')
          } catch (_cancelError) {
            // Ignore cancellation errors while already closing/closed.
          }
          throw error
        }

        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (result.done) {
          break
        }

        values.push(result.value)
        if (values.length > maxChunks) {
          throw new Error('Stream produced too many chunks during validation.')
        }
      }
    } finally {
      reader.releaseLock()
    }

    return values
  }

  test('skips auth when agent access is public and auth provider is disabled', async () => {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'none'
    process.env.CHM_FEATURE_AGENT_ACCESS = 'public'

    const request = new Request('http://localhost:3000/api/v1/agent', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Show me all databases',
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  test('returns 401 when Clerk auth is enabled and credentials are missing', async () => {
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const request = new Request('http://localhost:3000/api/v1/agent', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Show me all databases',
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toBe('Bearer')
  })

  test('accepts Clerk session without Bearer token', async () => {
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'
    mockClerkUserId = 'user_123'

    const request = new Request('http://localhost:3000/api/v1/agent', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Show me all databases',
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  test('accepts lowercase bearer token scheme', async () => {
    process.env.CHM_FEATURE_AGENT_ACCESS = 'authenticated'

    const request = new Request('http://localhost:3000/api/v1/agent', {
      method: 'POST',
      headers: { authorization: 'bearer test-agent-token' },
      body: JSON.stringify({
        message: 'Show me all databases',
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  test('accepts UIMessage format with id and parts', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-123',
            role: 'user',
            parts: [{ type: 'text', text: 'Show me all databases' }],
          },
        ],
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
  })

  test('accepts backward compatible message format', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Show me all databases',
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  test('handles both message and messages formats', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Test',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Override message' }],
          },
        ],
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  test('returns 400 when message is missing', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        messages: [],
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('returns 400 when message is not a string', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 123,
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('returns 400 when message is empty string', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: '   ',
        hostId: 0,
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  test('returns 400 on malformed JSON', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: 'invalid json',
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  test('returns INVALID_JSON when request body is a JSON array', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: '[{"role":"user","parts":[{"type":"text","text":"bad"}]}]',
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const payload = (await response.json()) as {
      error: { limitBytes: number }
    }
    expect(payload).toMatchObject({ error: { code: 'INVALID_JSON' } })
  })

  test('returns JSON stream for valid input', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Check stream flow',
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
  })

  test('uses inline json-render system prompt', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Show the top tables',
        hostId: 1,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.systemPrompt).toBe(
      AGENT_JSON_RENDER_INLINE_PROMPT
    )
  })

  test('forwards inline stream metadata into AI message flow', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Show me metrics' }],
          },
        ],
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(capturedAIArgs[0]).toMatchObject({
      originalMessageCount: 1,
    })
    expect(capturedAIArgs[0]?.mergedChunk).toBeDefined()
  })

  test('keeps non-user conversation messages in context', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            id: 'assistant-msg',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Previous result' }],
          },
          {
            id: 'user-msg',
            role: 'user',
            parts: [{ type: 'text', text: 'Follow up question' }],
          },
        ],
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAIArgs[0]).toMatchObject({
      originalMessageCount: 2,
    })
  })

  test('forwards model override and disabled tools configuration', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Run quick diagnostics',
        hostId: 0,
        model: 'openrouter/auto',
        disabledTools: ['query', 123, 'list_databases'],
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.model).toBe('openrouter/auto')
    expect(capturedAgentArgs[0]?.disabledTools).toEqual([
      'query',
      'list_databases',
    ])
    expect(response.headers.get('cache-control')).toBe('no-cache')
  })

  test('defaults to OpenRouter free router when no model is configured', async () => {
    delete process.env.LLM_MODEL

    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Run quick diagnostics',
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.model).toBe('openrouter/free')
  })

  test('accepts documented unprefixed OpenRouter model with OpenRouter key', async () => {
    process.env.LLM_MODEL = 'openrouter/free'
    delete process.env.LLM_API_KEY
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key'

    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Run quick diagnostics',
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.model).toBe('openrouter/free')
  })

  test('accepts unprefixed free OpenRouter model with OpenRouter key', async () => {
    process.env.LLM_MODEL = 'qwen/qwen3-coder:free'
    delete process.env.LLM_API_KEY
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key'

    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Run quick diagnostics',
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.model).toBe('qwen/qwen3-coder:free')
  })

  test('streams structured error metadata when the model cannot answer', async () => {
    mockAgentStreamError = {
      statusCode: 502,
      responseBody: JSON.stringify({
        error: {
          code: 'upstream_exhausted',
          message: 'Every upstream failed',
          metadata: {
            upstream_backend: 'openrouter',
            upstream_status: 502,
            upstream_message: 'no route returned content',
          },
        },
      }),
    }

    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Run quick diagnostics',
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAIArgs[0]?.writtenChunks).toContainEqual({
      type: 'data-error',
      data: [
        expect.objectContaining({
          type: 'upstream_error',
          code: 'upstream_exhausted',
          upstreamBackend: 'openrouter',
          upstreamMessage: 'no route returned content',
        }),
      ],
    })
  })

  test('forwards explicit hostId to agent factory', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        message: 'Compare hosts',
        hostId: 3,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.hostId).toBe(3)
  })

  test('defaults hostId to 0 when hostId is missing or invalid', async () => {
    const response = await POST(
      createAgentRequest({
        method: 'POST',
        body: JSON.stringify({
          message: 'Check default host',
          hostId: 'abc',
        }),
      })
    )
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
    expect(capturedAgentArgs[0]?.hostId).toBe(0)
  })

  test('accepts malformed messages payload when message text is provided', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        messages: { id: 'not-array' } as unknown,
        message: 'Use latest query',
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
  })

  test('handles tool-only user messages without text part for streaming', async () => {
    const request = createAgentRequest({
      method: 'POST',
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-tool-only',
            role: 'user',
            parts: [{ type: 'dynamic-tool', toolCallId: 'tool-1' }],
          },
        ],
        hostId: 0,
      }),
    })

    const response = await POST(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
  })

  test('accepts legacy content-only messages', async () => {
    const response = await POST(
      createAgentRequest({
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Legacy message format still works' },
          ],
        }),
      })
    )

    const body = await response.text()
    expect(response.status).toBe(200)
    expect(body).toBe('mocked stream: object')
  })

  test('rejects malformed and oversized message arrays', async () => {
    const messages = Array.from({ length: 65 }, (_, index) => ({
      id: `msg-${index}`,
      role: 'user',
      parts: [{ type: 'text', text: `Message ${index}` }],
    }))

    const response = await POST(
      createAgentRequest({
        method: 'POST',
        body: JSON.stringify({ messages }),
      })
    )

    expect(response.status).toBe(400)
  })

  test('rejects oversized payloads before agent execution', async () => {
    const largePayload = {
      message: 'x'.repeat(1024 * 140),
      hostId: 0,
    }

    const response = await POST(
      createAgentRequest({
        method: 'POST',
        body: JSON.stringify(largePayload),
      })
    )

    expect(response.status).toBe(413)
    const payload = await response.json()
    expect(payload).toHaveProperty('error')
    expect(payload.error).toMatchObject({ limitBytes: 131072 })
    expect(capturedAgentArgs).toHaveLength(0)
  })

  test('guards malformed and invalid spec chunks during server-side stream merge', async () => {
    const validFlatSpec = {
      type: 'data-spec',
      data: {
        type: 'flat',
        spec: {
          root: 'card-root',
          elements: {
            'card-root': {
              type: 'Card',
              props: {
                title: 'Root',
              },
              children: [],
            },
          },
        },
      },
    }
    const invalidFlatSpec = {
      type: 'data-spec',
      data: {
        type: 'flat',
        spec: {
          root: 'forbidden-root',
          elements: {
            'forbidden-root': {
              type: 'NotAllowed',
              props: {},
              children: [],
            },
          },
        },
      },
    }

    const sourceStream = new ReadableStream({
      start: (controller) => {
        controller.enqueue(validFlatSpec)
        controller.enqueue(invalidFlatSpec)
        controller.close()
      },
    })

    const guarded = createJsonRenderPatchGuardStream(sourceStream)
    const values = await readJsonRenderStreamValues(guarded)

    expect(values).toHaveLength(1)
    expect(values).toStrictEqual([validFlatSpec])
  })

  test('drops oversize data-spec chunks to prevent stream abuse', async () => {
    const oversizedChunk = {
      type: 'data-spec',
      data: {
        type: 'patch',
        patch: {
          op: 'add',
          path: '/root',
          value: 'x'.repeat(AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES + 1),
        },
      },
    }

    const sourceStream = new ReadableStream({
      start: (controller) => {
        controller.enqueue(oversizedChunk)
        controller.close()
      },
    })

    const guarded = createJsonRenderPatchGuardStream(sourceStream)
    const values = await readJsonRenderStreamValues(guarded)

    expect(values).toHaveLength(0)
  })

  test('drops patch chunks targeting dangerous JSON pointer segments', async () => {
    const dangerousPatchChunk = {
      type: 'data-spec',
      data: {
        type: 'patch',
        patch: {
          op: 'add',
          path: '/elements/__proto__/polluted',
          value: { enabled: true },
        },
      },
    }

    const sourceStream = new ReadableStream({
      start: (controller) => {
        controller.enqueue(dangerousPatchChunk)
        controller.close()
      },
    })

    const guarded = createJsonRenderPatchGuardStream(sourceStream)
    const values = await readJsonRenderStreamValues(guarded)

    expect(values).toHaveLength(0)
  })
})
