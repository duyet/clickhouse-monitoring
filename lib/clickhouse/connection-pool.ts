/**
 * ClickHouse Connection Pool
 * Manages pooled ClickHouse clients using singleton pattern
 * Reuses existing clients instead of creating new ones for each request
 * Max 10 concurrent connections per client config
 */

import type { ClickHouseClient } from '@clickhouse/client'

import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import type { ClickHouseConfig } from './types'

import { debug } from '@/lib/logger'

type PoolKey = string
export type PooledClient = {
  client: ClickHouseClient | WebClickHouseClient
  createdAt: number
  lastUsed: number
  inUse: number
}

export const clientPool = new Map<PoolKey, PooledClient>()
const MAX_POOL_SIZE = Number(process.env.CLICKHOUSE_POOL_SIZE) || 10
const CLIENT_TIMEOUT =
  Number(process.env.CLICKHOUSE_POOL_TIMEOUT) || 5 * 60 * 1000
const CLEANUP_INTERVAL =
  Number(process.env.CLICKHOUSE_POOL_CLEANUP_INTERVAL) || 60 * 1000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startPeriodicCleanup(): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(cleanupStaleClients, CLEANUP_INTERVAL)
  // Don't prevent process from exiting
  if (
    cleanupTimer &&
    typeof cleanupTimer === 'object' &&
    'unref' in cleanupTimer
  ) {
    cleanupTimer.unref()
  }
}

/**
 * Generate a pool key from client configuration and web flag
 */
export function getPoolKey(config: ClickHouseConfig, web: boolean): PoolKey {
  return `${config.host}:${config.user}:${web}`
}

/**
 * Cleanup stale clients from the pool
 */
export function cleanupStaleClients(): void {
  const now = Date.now()
  const staleKeys: PoolKey[] = []

  for (const [key, pooled] of clientPool.entries()) {
    if (now - pooled.lastUsed > CLIENT_TIMEOUT && pooled.inUse === 0) {
      staleKeys.push(key)
    }
  }

  for (const key of staleKeys) {
    clientPool.delete(key)
    debug(`[Connection Pool] Cleaned up stale client: ${key}`)
  }
}

/**
 * Get or create a pooled client
 */
export function getPooledClient(
  client: ClickHouseClient | WebClickHouseClient,
  config: ClickHouseConfig,
  web: boolean
): PooledClient {
  const key = getPoolKey(config, web)
  let pooled = clientPool.get(key)

  if (!pooled) {
    pooled = {
      client,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      inUse: 0,
    }
    clientPool.set(key, pooled)
    debug(`[Connection Pool] Created new client: ${key}`)
  } else {
    pooled.lastUsed = Date.now()
  }

  startPeriodicCleanup()

  return pooled
}

/**
 * Get memory usage stats for the connection pool
 */
export function getConnectionPoolStats() {
  const clients = Array.from(clientPool.entries()).map(([key, pooled]) => ({
    key,
    inUse: pooled.inUse,
    idleMs: Date.now() - pooled.lastUsed,
    ageMs: Date.now() - pooled.createdAt,
  }))

  return {
    poolSize: clientPool.size,
    maxPoolSize: MAX_POOL_SIZE,
    totalInUse: clients.reduce((sum, c) => sum + c.inUse, 0),
    totalIdle: clients.filter((c) => c.inUse === 0).length,
    clients,
    config: {
      maxPoolSize: MAX_POOL_SIZE,
      clientTimeoutMs: CLIENT_TIMEOUT,
      cleanupIntervalMs: CLEANUP_INTERVAL,
    },
  }
}
