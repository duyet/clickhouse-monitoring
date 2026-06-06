import { beforeEach, describe, expect, mock, test } from 'bun:test'

const inserted: unknown[] = []
const commands: string[] = []

mock.module('@chm/clickhouse-client', () => ({
  getClient: async () => ({
    command: async ({ query }: { query: string }) => {
      commands.push(query)
    },
    insert: async (payload: unknown) => {
      inserted.push(payload)
    },
    query: async () => ({
      json: async () => [],
    }),
  }),
}))

const {
  ClickHouseConversationStore,
  createClickHouseConversationsTableSql,
  parseClickHouseTableIdentifier,
} = await import('../clickhouse-store')

describe('ClickHouseConversationStore', () => {
  beforeEach(() => {
    inserted.length = 0
    commands.length = 0
  })

  test('generates the requested MergeTree schema', () => {
    const sql = createClickHouseConversationsTableSql(
      'system.agent_conversations'
    )
    expect(sql).toContain('ReplacingMergeTree(updated_at_ms, is_deleted)')
    expect(sql).toContain('PARTITION BY toYYYYMM(updated_at)')
    expect(sql).toContain('ORDER BY (user_id, conversation_id, updated_at)')
    expect(sql).toContain('LowCardinality(String)')
  })

  test('rejects unsafe table names', () => {
    expect(() =>
      parseClickHouseTableIdentifier('system.agent_conversations')
    ).not.toThrow()
    expect(() =>
      parseClickHouseTableIdentifier('system.agent;DROP TABLE x')
    ).toThrow()
  })

  test('uses async insert settings', async () => {
    const store = new ClickHouseConversationStore({
      enabled: true,
      requestedStore: 'clickhouse',
      store: 'clickhouse',
      agentStateApiBase: 'https://agentstate.app/api',
      durableObjectBinding: 'AGENT_CONVERSATIONS_DO',
      clickHouseTable: 'system.agent_conversations',
      clickHouseAutoCreate: true,
      legacyAliasEnabled: false,
    })

    await store.upsert({
      id: 'thread-1',
      userId: 'user-1',
      title: 'Thread',
      messages: [],
      messageCount: 0,
      createdAt: 1,
      updatedAt: 2,
    })

    expect(commands).toHaveLength(1)
    expect(inserted[0]).toMatchObject({
      table: 'system.agent_conversations',
      clickhouse_settings: {
        async_insert: 1,
        wait_for_async_insert: 1,
      },
    })
  })
})
