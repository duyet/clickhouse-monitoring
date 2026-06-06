import { ConversationStoreError } from './types'

export const CONVERSATION_STORE_VALUES = [
  'auto',
  'agentstate',
  'd1',
  'durable-object',
  'clickhouse',
  'postgres',
  'memory',
  'local',
] as const

export type ConversationStoreSelection =
  (typeof CONVERSATION_STORE_VALUES)[number]

export type ResolvedConversationStore =
  | Exclude<ConversationStoreSelection, 'auto'>
  | 'disabled'

export interface ConversationStoreConfig {
  enabled: boolean
  requestedStore: ConversationStoreSelection
  store: ResolvedConversationStore
  agentStateApiBase: string
  agentStateApiKey?: string
  durableObjectBinding: string
  clickHouseTable: string
  clickHouseAutoCreate: boolean
  postgresUrl?: string
  legacyAliasEnabled: boolean
}

type Env = Record<string, string | undefined>

const DEFAULT_AGENTSTATE_API_BASE = 'https://agentstate.app/api'
const DEFAULT_DURABLE_OBJECT_BINDING = 'AGENT_CONVERSATIONS_DO'

function readBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined

  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  throw new ConversationStoreError(
    `Invalid boolean value "${value}" for conversation persistence config.`,
    'VALIDATION_ERROR'
  )
}

function readStore(value: string | undefined): ConversationStoreSelection {
  const normalized = (value || 'auto').trim().toLowerCase()
  if (
    CONVERSATION_STORE_VALUES.includes(normalized as ConversationStoreSelection)
  ) {
    return normalized as ConversationStoreSelection
  }

  throw new ConversationStoreError(
    `Invalid AGENT_CONVERSATION_STORE "${value}". Expected one of: ${CONVERSATION_STORE_VALUES.join(', ')}.`,
    'VALIDATION_ERROR'
  )
}

function readClickHouseTable(env: Env): string {
  const explicit = env.CLICKHOUSE_AGENT_CONVERSATIONS_TABLE?.trim()
  if (explicit) return explicit

  const database = env.CLICKHOUSE_DATABASE?.trim() || 'system'
  return `${database}.agent_conversations`
}

function readPostgresUrl(env: Env): string | undefined {
  return (
    env.DATABASE_URL?.trim() ||
    env.POSTGRES_URL?.trim() ||
    env.POSTGRES_PRISMA_URL?.trim() ||
    undefined
  )
}

function hasClickHouseConversationIntent(env: Env): boolean {
  return !!env.CLICKHOUSE_AGENT_CONVERSATIONS_TABLE?.trim()
}

function hasClickHouseHost(env: Env): boolean {
  return !!env.CLICKHOUSE_HOST?.trim()
}

export function isConversationPersistenceEnabled(
  env: Env = process.env
): boolean {
  const primary = readBoolean(env.AGENT_CONVERSATION_PERSISTENCE)
  if (primary !== undefined) return primary

  return readBoolean(env.NEXT_PUBLIC_FEATURE_CONVERSATION_DB) === true
}

export function getConversationStoreConfig(
  env: Env = process.env
): ConversationStoreConfig {
  const requestedStore = readStore(env.AGENT_CONVERSATION_STORE)
  const legacyAliasEnabled =
    readBoolean(env.NEXT_PUBLIC_FEATURE_CONVERSATION_DB) === true
  const enabled = isConversationPersistenceEnabled(env)

  const config: ConversationStoreConfig = {
    enabled,
    requestedStore,
    store: enabled && requestedStore !== 'auto' ? requestedStore : 'disabled',
    agentStateApiBase:
      env.AGENTSTATE_API_BASE?.trim() || DEFAULT_AGENTSTATE_API_BASE,
    agentStateApiKey: env.AGENTSTATE_API_KEY?.trim() || undefined,
    durableObjectBinding:
      env.AGENT_CONVERSATIONS_DO_BINDING?.trim() ||
      DEFAULT_DURABLE_OBJECT_BINDING,
    clickHouseTable: readClickHouseTable(env),
    clickHouseAutoCreate:
      readBoolean(env.CLICKHOUSE_AGENT_CONVERSATIONS_AUTO_CREATE) !== false,
    postgresUrl: readPostgresUrl(env),
    legacyAliasEnabled,
  }

  validateConversationStoreConfig(config, env)
  return config
}

export function validateConversationStoreConfig(
  config: ConversationStoreConfig,
  env: Env = process.env
): void {
  if (!config.enabled) return

  if (
    config.requestedStore === 'agentstate' ||
    (config.requestedStore === 'auto' && config.agentStateApiKey)
  ) {
    if (config.requestedStore === 'agentstate' && !config.agentStateApiKey) {
      throw new ConversationStoreError(
        'AGENTSTATE_API_KEY is required when AGENT_CONVERSATION_STORE=agentstate.',
        'VALIDATION_ERROR'
      )
    }

    if (
      config.agentStateApiKey &&
      !config.agentStateApiKey.startsWith('as_live_')
    ) {
      throw new ConversationStoreError(
        'AGENTSTATE_API_KEY must start with "as_live_".',
        'VALIDATION_ERROR'
      )
    }
  }

  if (config.requestedStore === 'postgres' && !config.postgresUrl) {
    throw new ConversationStoreError(
      'DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL is required when AGENT_CONVERSATION_STORE=postgres.',
      'VALIDATION_ERROR'
    )
  }

  if (config.requestedStore === 'clickhouse' && !env.CLICKHOUSE_HOST?.trim()) {
    throw new ConversationStoreError(
      'CLICKHOUSE_HOST is required when AGENT_CONVERSATION_STORE=clickhouse.',
      'VALIDATION_ERROR'
    )
  }

  if (config.requestedStore === 'memory' && env.NODE_ENV === 'production') {
    throw new ConversationStoreError(
      'AGENT_CONVERSATION_STORE=memory is only allowed in development or tests.',
      'VALIDATION_ERROR'
    )
  }
}

export function shouldTryClickHouseInAuto(env: Env = process.env): boolean {
  return hasClickHouseConversationIntent(env) && hasClickHouseHost(env)
}
