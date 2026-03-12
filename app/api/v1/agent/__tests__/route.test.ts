import { describe, expect, mock, test } from 'bun:test'

// Mock the agent factory
mock.module('@/lib/ai/agent', () => ({
  createClickHouseAgent: () => ({
    id: 'test-clickhouse-agent',
    model: {},
    tools: {
      query: {
        description: 'Mock query tool',
      },
      list_databases: {
        description: 'Mock list_databases tool',
      },
    },
  }),
}))

// Mock createAgentUIStreamResponse
mock.module('ai', () => ({
  createAgentUIStreamResponse: ({
    uiMessages: _uiMessages,
    onError: _onError,
  }: {
    uiMessages: unknown[]
    onError?: (error: unknown) => string
  }) => {
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Simulate streaming response
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'text-delta', textDelta: 'Test response' })}\n\n`
          )
          controller.close()
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    )
  },
}))

describe('POST /api/v1/agent', () => {
  // We need to dynamically import the route handler after mocking
  let POST: (request: Request) => Promise<Response>

  beforeAll(async () => {
    // Import after mocks are set up
    const route = await import('../route')
    POST = route.POST
  })

  describe('UIMessage format handling', () => {
    test('accepts UIMessage format with id and parts', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
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
      expect(response.headers.get('content-type')).toContain(
        'text/event-stream'
      )
    })

    test('accepts backward compatible message format', async () => {
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

    test('handles both message and messages formats', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
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
  })

  describe('validation', () => {
    test('returns 400 when message is missing', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
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
      const request = new Request('http://localhost:3000/api/v1/agent', {
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
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: '   ',
          hostId: 0,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('hostId handling', () => {
    test('uses provided hostId', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          hostId: 1,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    test('defaults to hostId 0 when not provided', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    test('handles non-number hostId by defaulting to 0', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          hostId: 'invalid' as unknown as number,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('model configuration', () => {
    test('passes model to agent factory', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          model: 'gpt-4o-mini',
          hostId: 0,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('response format', () => {
    test('returns SSE stream with correct headers', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              parts: [{ type: 'text', text: 'Test' }],
            },
          ],
          hostId: 0,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain(
        'text/event-stream'
      )
      expect(response.headers.get('cache-control')).toBe('no-cache')
    })

    test('returns JSON error response for validation failures', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: '',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(response.headers.get('content-type')).toBe('application/json')
    })
  })

  describe('error handling', () => {
    test('handles malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: 'invalid json',
      })

      // Should throw on JSON.parse
      await expect(POST(request)).rejects.toThrow()
    })
  })

  describe('UIMessage parts extraction', () => {
    test('extracts text from parts array', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              parts: [
                { type: 'text', text: 'Extract this text' },
                { type: 'tool-call', toolCallId: 'tool-1' },
              ],
            },
          ],
          hostId: 0,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    test('handles missing text part in parts array', async () => {
      const request = new Request('http://localhost:3000/api/v1/agent', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              parts: [{ type: 'tool-call', toolCallId: 'tool-1' }],
            },
          ],
          hostId: 0,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})
