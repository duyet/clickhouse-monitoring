/**
 * Conversation store resolver for server runtime backend detection.
 */

import type {
  ConversationStoreConfig,
  ResolvedConversationStore,
} from './config'
import type { ConversationStore } from './types'

import { AgentStateStore } from './agentstate-store'
import { ClickHouseConversationStore } from './clickhouse-store'
import { getConversationStoreConfig, shouldTryClickHouseInAuto } from './config'
import { D1Store } from './d1-store'
import { DurableObjectConversationStore } from './durable-object-store'
import { MemoryStore } from './memory-store'
import { PostgresStore } from './postgres-store'
import { ConversationStoreError } from './types'
import { getPlatformBindings } from '@chm/platform'

const D1_BINDING_NAME = 'CONVERSATIONS_D1'

export interface ConversationStoreStatus {
  enabled: boolean
  requestedStore: ConversationStoreConfig['requestedStore']
  store: ResolvedConversationStore
  persistent: boolean
  reason?: string
}

function getPostgresStore(config: ConversationStoreConfig): PostgresStore {
  if (!config.postgresUrl) {
    throw new ConversationStoreError(
      'PostgreSQL conversation store requires DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL.',
      'VALIDATION_ERROR'
    )
  }
  return new PostgresStore(config.postgresUrl)
}

function requireD1Binding(): void {
  const db = getPlatformBindings().getD1Database(D1_BINDING_NAME)
  if (!db) {
    throw new ConversationStoreError(
      'CONVERSATIONS_D1 binding not found.',
      'STORAGE_ERROR'
    )
  }
}

function requireDurableObjectBinding(config: ConversationStoreConfig): void {
  const namespace = getPlatformBindings().getDurableObjectNamespace(
    config.durableObjectBinding
  )
  if (!namespace) {
    throw new ConversationStoreError(
      `${config.durableObjectBinding} Durable Object binding not found.`,
      'STORAGE_ERROR'
    )
  }
}

function memoryAllowed(): boolean {
  return process.env.NODE_ENV !== 'production'
}

/**
 * Returns the configured server store name without constructing the store.
 */
export function resolveConversationStoreStatus(
  config = getConversationStoreConfig()
): ConversationStoreStatus {
  if (!config.enabled || config.requestedStore === 'local') {
    return {
      enabled: false,
      requestedStore: config.requestedStore,
      store: 'disabled',
      persistent: false,
      reason: !config.enabled
        ? 'Conversation persistence is disabled.'
        : 'Conversation history is configured for browser localStorage.',
    }
  }

  if (config.requestedStore !== 'auto') {
    return {
      enabled: true,
      requestedStore: config.requestedStore,
      store: config.requestedStore,
      persistent: config.requestedStore !== 'memory',
    }
  }

  if (config.agentStateApiKey) {
    return {
      enabled: true,
      requestedStore: 'auto',
      store: 'agentstate',
      persistent: true,
    }
  }

  try {
    if (getPlatformBindings().getD1Database(D1_BINDING_NAME)) {
      return {
        enabled: true,
        requestedStore: 'auto',
        store: 'd1',
        persistent: true,
      }
    }
  } catch {
    // Continue to the next auto candidate.
  }

  try {
    if (
      getPlatformBindings().getDurableObjectNamespace(
        config.durableObjectBinding
      )
    ) {
      return {
        enabled: true,
        requestedStore: 'auto',
        store: 'durable-object',
        persistent: true,
      }
    }
  } catch {
    // Continue to the next auto candidate.
  }

  if (config.postgresUrl) {
    return {
      enabled: true,
      requestedStore: 'auto',
      store: 'postgres',
      persistent: true,
    }
  }

  if (shouldTryClickHouseInAuto()) {
    return {
      enabled: true,
      requestedStore: 'auto',
      store: 'clickhouse',
      persistent: true,
    }
  }

  if (memoryAllowed()) {
    return {
      enabled: true,
      requestedStore: 'auto',
      store: 'memory',
      persistent: false,
      reason:
        'No persistent conversation store is configured. Using memory for development/test only.',
    }
  }

  return {
    enabled: false,
    requestedStore: 'auto',
    store: 'disabled',
    persistent: false,
    reason:
      'No persistent conversation store is configured for production. Set AGENT_CONVERSATION_STORE and the required backend env vars.',
  }
}

/**
 * Resolves the appropriate server-side conversation store implementation.
 */
export async function resolveStore(): Promise<ConversationStore> {
  const config = getConversationStoreConfig()
  const status = resolveConversationStoreStatus(config)

  if (!status.enabled) {
    throw new ConversationStoreError(
      status.reason || 'Conversation persistence is disabled.',
      'DISABLED'
    )
  }

  switch (status.store) {
    case 'agentstate':
      return new AgentStateStore(config)
    case 'd1':
      requireD1Binding()
      return new D1Store()
    case 'durable-object':
      requireDurableObjectBinding(config)
      return new DurableObjectConversationStore(config.durableObjectBinding)
    case 'clickhouse':
      return new ClickHouseConversationStore(config)
    case 'postgres':
      return getPostgresStore(config)
    case 'memory':
      if (!memoryAllowed()) {
        throw new ConversationStoreError(
          'Memory conversation store is only allowed in development or tests.',
          'VALIDATION_ERROR'
        )
      }
      return new MemoryStore()
    case 'local':
    case 'disabled':
      throw new ConversationStoreError(
        'Browser localStorage conversation history is not available through server APIs.',
        'DISABLED'
      )
    default:
      throw new ConversationStoreError(
        `Unsupported conversation store: ${status.store}`,
        'VALIDATION_ERROR'
      )
  }
}

export function isPersistentStore(store: ConversationStore): boolean {
  return (
    store instanceof AgentStateStore ||
    store instanceof D1Store ||
    store instanceof DurableObjectConversationStore ||
    store instanceof ClickHouseConversationStore ||
    store instanceof PostgresStore
  )
}
