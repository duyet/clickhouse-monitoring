import {
  getConversationStoreConfig,
  isConversationPersistenceEnabled,
} from '../config'
import { resolveConversationStoreStatus } from '../resolve-store'
import { ConversationStoreError } from '../types'
import { describe, expect, test } from 'bun:test'

describe('conversation store config', () => {
  test('defaults to disabled auto store', () => {
    const config = getConversationStoreConfig({})
    expect(config.enabled).toBe(false)
    expect(config.requestedStore).toBe('auto')
    expect(config.store).toBe('disabled')
  })

  test('uses deprecated public flag as an enable alias', () => {
    expect(
      isConversationPersistenceEnabled({
        NEXT_PUBLIC_FEATURE_CONVERSATION_DB: 'true',
      })
    ).toBe(true)
  })

  test('validates supported store names', () => {
    expect(() =>
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENT_CONVERSATION_STORE: 'sqlite',
      })
    ).toThrow(ConversationStoreError)
  })

  test('requires AgentState API key and prefix', () => {
    expect(() =>
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENT_CONVERSATION_STORE: 'agentstate',
      })
    ).toThrow('AGENTSTATE_API_KEY')

    expect(() =>
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENT_CONVERSATION_STORE: 'agentstate',
        AGENTSTATE_API_KEY: 'sk_live_bad',
      })
    ).toThrow('as_live_')

    expect(() =>
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENTSTATE_API_KEY: 'sk_live_bad',
      })
    ).toThrow('as_live_')
  })

  test('requires Postgres URL for postgres store', () => {
    expect(() =>
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENT_CONVERSATION_STORE: 'postgres',
      })
    ).toThrow('DATABASE_URL')
  })

  test('requires ClickHouse host for clickhouse store', () => {
    expect(() =>
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENT_CONVERSATION_STORE: 'clickhouse',
      })
    ).toThrow('CLICKHOUSE_HOST')
  })

  test('rejects production memory store', () => {
    expect(() =>
      getConversationStoreConfig({
        NODE_ENV: 'production',
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENT_CONVERSATION_STORE: 'memory',
      })
    ).toThrow('memory')
  })

  test('auto selects AgentState when key is configured', () => {
    const status = resolveConversationStoreStatus(
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        AGENTSTATE_API_KEY: 'as_live_test',
      })
    )
    expect(status.store).toBe('agentstate')
    expect(status.persistent).toBe(true)
  })

  test('auto skips ClickHouse table intent without a ClickHouse host', () => {
    const status = resolveConversationStoreStatus(
      getConversationStoreConfig({
        AGENT_CONVERSATION_PERSISTENCE: 'true',
        CLICKHOUSE_AGENT_CONVERSATIONS_TABLE: 'system.agent_conversations',
      })
    )
    expect(status.store).toBe('memory')
    expect(status.persistent).toBe(false)
  })
})
