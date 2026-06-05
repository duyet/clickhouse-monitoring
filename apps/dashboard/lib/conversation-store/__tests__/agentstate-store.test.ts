import { AgentStateStore } from '../agentstate-store'
import { afterEach, describe, expect, test } from 'bun:test'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('AgentStateStore', () => {
  test('creates a conversation with external id and metadata', async () => {
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

    const store = new AgentStateStore({
      enabled: true,
      requestedStore: 'agentstate',
      store: 'agentstate',
      agentStateApiBase: 'https://agentstate.app/api',
      agentStateApiKey: 'as_live_test',
      durableObjectBinding: 'AGENT_CONVERSATIONS_DO',
      clickHouseTable: 'system.agent_conversations',
      clickHouseAutoCreate: true,
      legacyAliasEnabled: false,
    })

    await store.upsert({
      id: 'thread-1',
      userId: 'user-1',
      title: 'Thread',
      messages: [
        { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      ],
      messageCount: 1,
      model: 'model-a',
      provider: 'provider-a',
      hostId: 0,
      createdAt: 1,
      updatedAt: 2,
    })

    const createCall = calls.find((call) =>
      call.url.endsWith('/v1/conversations')
    )
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.init?.body))).toMatchObject({
      external_id: 'thread-1',
      metadata: {
        source: 'clickhouse-monitor',
        user_id: 'user-1',
        model: 'model-a',
        provider: 'provider-a',
      },
    })
  })

  test('recreates remote conversation when existing messages change', async () => {
    const methods: string[] = []
    globalThis.fetch = (async (url, init) => {
      methods.push(`${init?.method ?? 'GET'} ${String(url)}`)
      if (String(url).includes('/by-external-id/')) {
        return Response.json({
          id: 'remote-1',
          external_id: 'thread-1',
          title: 'Thread',
          metadata: {
            source: 'clickhouse-monitor',
            user_id: 'user-1',
            raw_metadata: {},
          },
          messages: [
            {
              role: 'user',
              content: 'old',
              metadata: {
                ui_message_id: 'm1',
                raw_ui_message: {
                  id: 'm1',
                  role: 'user',
                  parts: [{ type: 'text', text: 'old' }],
                },
              },
            },
          ],
        })
      }
      return Response.json({ id: 'remote-1' })
    }) as typeof fetch

    const store = new AgentStateStore({
      enabled: true,
      requestedStore: 'agentstate',
      store: 'agentstate',
      agentStateApiBase: 'https://agentstate.app/api',
      agentStateApiKey: 'as_live_test',
      durableObjectBinding: 'AGENT_CONVERSATIONS_DO',
      clickHouseTable: 'system.agent_conversations',
      clickHouseAutoCreate: true,
      legacyAliasEnabled: false,
    })

    await store.upsert({
      id: 'thread-1',
      userId: 'user-1',
      title: 'Thread',
      messages: [
        { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'new' }] },
      ],
      messageCount: 1,
      createdAt: 1,
      updatedAt: 2,
    })

    expect(methods.some((method) => method.startsWith('DELETE '))).toBe(true)
    expect(
      methods.some(
        (method) =>
          method.startsWith('POST ') && method.endsWith('/v1/conversations')
      )
    ).toBe(true)
  })
})
