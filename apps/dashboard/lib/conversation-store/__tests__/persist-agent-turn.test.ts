import { afterEach, describe, expect, test } from 'bun:test'
import { getClerkUserId, setMockClerkUserId } from '@/__mocks__/clerk-auth-mock'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  setMockClerkUserId(null)
  delete process.env.AGENT_CONVERSATION_PERSISTENCE
  delete process.env.AGENT_CONVERSATION_STORE
  delete process.env.AGENTSTATE_API_KEY
  delete process.env.CLERK_SECRET_KEY
})

describe('persistAgentConversationTurn', () => {
  test('stores completed turns in AgentState with the durable thread id', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    globalThis.fetch = (async (url, init) => {
      calls.push({ url: String(url), init })
      if (String(url).includes('/by-external-id/')) {
        return new Response(JSON.stringify({ error: { code: 'NOT_FOUND' } }), {
          status: 404,
        })
      }
      return Response.json({ id: 'remote-1' })
    }) as typeof fetch

    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    process.env.AGENT_CONVERSATION_PERSISTENCE = 'true'
    process.env.AGENT_CONVERSATION_STORE = 'agentstate'
    process.env.AGENTSTATE_API_KEY = 'as_live_test'
    process.env.CLERK_SECRET_KEY = 'sk_test'
    setMockClerkUserId('user_123')
    expect(getClerkUserId()).toBe('user_123')

    const { persistAgentConversationTurn } = await import(
      '../persist-agent-turn'
    )

    await persistAgentConversationTurn({
      conversationId: 'thread-from-assistant-ui',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Show me merges' }],
        },
      ],
      hostId: 2,
      model: 'openrouter:auto',
      provider: 'openrouter',
      resolvedModel: 'resolved-model',
      sessionId: 'session-1',
      finishReason: 'stop',
    })

    const createCall = calls.find((call) =>
      call.url.endsWith('/v1/conversations')
    )
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.init?.body))).toMatchObject({
      external_id: 'thread-from-assistant-ui',
      metadata: {
        source: 'clickhouse-monitor',
        user_id: 'user_123',
        host_id: 2,
      },
    })
  })
})
