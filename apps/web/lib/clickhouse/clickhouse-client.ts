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

import { getAndValidateClientConfig } from './clickhouse-config'
import {
  clientPool,
  getConnectionPoolStats,
  getPooledClient,
  getPoolKey,
} from './connection-pool'
import { validateClickHouseEnv } from './env-schema'
import { isCloudflareWorkers } from '@/lib/runtime/cloudflare-workers'

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
  // Auto-detect environment: use web client for Cloudflare Workers
  // Cloudflare Workers don't support Node.js APIs like https.request
  const isWeb = web === true || (web === undefined && isCloudflareWorkers())
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

// Re-export connection pool stats
export { getConnectionPoolStats, isCloudflareWorkers }
