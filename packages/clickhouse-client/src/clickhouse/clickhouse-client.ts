/**
 * ClickHouse Client Factory
 * Creates ClickHouse clients with connection pooling
 * Auto-detects Cloudflare Workers environment and uses appropriate client
 */

import type { ClickHouseClient, ClickHouseSettings } from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import {
  createClient as createClientWeb,
  type ClickHouseClient as WebClickHouseClient,
} from '@clickhouse/client-web'

import type { ClickHouseConfig } from './types'

import { isCloudflareWorkers } from '../runtime/cloudflare-workers'
import { getAndValidateClientConfig } from './clickhouse-config'
import {
  clientPool,
  getConnectionPoolStats,
  getPooledClient,
  getPoolKey,
} from './connection-pool'
import { validateClickHouseEnv } from './env-schema'

export const getClient = async ({
  web,
  clickhouseSettings,
  clientConfig,
  hostId,
}: {
  web?: boolean
  clickhouseSettings?: ClickHouseSettings
  clientConfig?: ClickHouseConfig
  hostId?: number
}): Promise<ClickHouseClient | WebClickHouseClient> => {
  // This app only ships @clickhouse/client-web. The node @clickhouse/client
  // is aliased to a throwing stub on BOTH build targets (see apps/dashboard
  // vite.config.ts '@clickhouse/client' alias → empty.ts), so any path that
  // selects the node client throws at runtime. The web client is fetch()-based
  // and works in Node 18+ AND Cloudflare Workers, so default to it; only an
  // explicit `web: false` selects the (stubbed) node path.
  const isWeb = web !== false
  const clientFactory = isWeb ? createClientWeb : createClient

  const config: ClickHouseConfig = clientConfig
    ? clientConfig
    : getAndValidateClientConfig(hostId ?? 0)

  // Check if client exists in pool
  const poolKey = getPoolKey(config, isWeb)
  let pooled = clientPool.get(poolKey)

  // If not in pool, create new client
  if (!pooled) {
    const newClient = clientFactory({
      url: config.host,
      username: config.user ?? 'default',
      password: config.password ?? '',
      // Default database for unqualified table names, when the config carries
      // one. Pooling is already scoped per-database via getPoolKey.
      ...(config.database ? { database: config.database } : {}),
      clickhouse_settings: {
        max_execution_time:
          validateClickHouseEnv().CLICKHOUSE_MAX_EXECUTION_TIME,
        ...clickhouseSettings,
      },
    })

    pooled = getPooledClient(newClient, config, isWeb)
  }

  // Update usage stats
  pooled.inUse++

  // Return the pooled client
  return Promise.resolve(pooled.client)
}

export const releaseClient = ({
  clientConfig,
  hostId,
  web,
}: {
  clientConfig?: ClickHouseConfig
  hostId?: number
  web?: boolean
}): void => {
  const isWeb = web !== false
  const config = clientConfig
    ? clientConfig
    : getAndValidateClientConfig(hostId ?? 0)
  const poolKey = getPoolKey(config, isWeb)
  const pooled = clientPool.get(poolKey)
  if (pooled) {
    pooled.inUse = Math.max(0, pooled.inUse - 1)
    pooled.lastUsed = Date.now()
  }
}

// Re-export connection pool stats
export { getConnectionPoolStats, isCloudflareWorkers }

/**
 * Re-export env cache reset so tests can reset the SAME env-schema instance
 * that this module's getClient() uses internally via clickhouse-config + env-schema.
 */
export { _resetEnvCache } from './env-schema'
