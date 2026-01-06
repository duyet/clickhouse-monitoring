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
const _MAX_POOL_SIZE = 10
const CLIENT_TIMEOUT = 5 * 60 * 1000 // 5 minutes

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

  // Cleanup stale clients periodically
  if (clientPool.size % 5 === 0) {
    cleanupStaleClients()
  }

  return pooled
}

/**
 * Get memory usage stats for the connection pool
 */
export function getConnectionPoolStats() {
  return {
    poolSize: clientPool.size,
    totalConnections: Array.from(clientPool.values()).reduce(
      (sum, p) => sum + p.inUse,
      0
    ),
  }
}
