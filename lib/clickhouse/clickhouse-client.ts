/**
 * ClickHouse Client Factory
 * Creates ClickHouse clients with connection pooling
 * Auto-detects Cloudflare Workers environment and uses appropriate client
 */

import type { ClickHouseClient, ClickHouseSettings } from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import { createClient as createClientWeb } from '@clickhouse/client-web'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import { getClickHouseConfigs } from './clickhouse-config'
import {
  clientPool,
  getConnectionPoolStats,
  getPooledClient,
  getPoolKey,
} from './connection-pool'
import { DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME } from './constants'
import type { ClickHouseConfig } from './types'

/**
 * Detect if running in Cloudflare Workers environment
 * Cloudflare Workers don't support Node.js APIs like https.request
 *
 * Note: When using @opennextjs/cloudflare, the code is bundled for Node.js
 * environment and process is polyfilled. We use an environment variable to
 * detect Cloudflare Workers deployment.
 */
export function isCloudflareWorkers(): boolean {
  // Check environment variable first (most reliable for Workers deployment)
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS === '1') {
    return true
  }

  // Runtime detection as fallback
  return (
    (typeof caches !== 'undefined' ||
      typeof (globalThis as any).WebSocketPair !== 'undefined' ||
      typeof (globalThis as any).DurableObject !== 'undefined') &&
    typeof process === 'undefined'
  )
}

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

  let config: ClickHouseConfig
  if (clientConfig) {
    config = clientConfig
  } else {
    const configs = getClickHouseConfigs()
    // hostId is now required for API usage; clientConfig should be provided for server-side
    const targetHostId = hostId ?? 0
    config = configs[targetHostId]

    if (!config) {
      throw new Error(
        `Invalid hostId: ${targetHostId}. Available hosts: 0-${configs.length - 1}`
      )
    }
  }

  // Check if client exists in pool
  const poolKey = getPoolKey(config, isWeb)
  let pooled = clientPool.get(poolKey)

  // If not in pool, create new client
  if (!pooled) {
    const newClient = clientFactory({
      host: config.host,
      username: config.user ?? 'default',
      password: config.password ?? '',
      clickhouse_settings: {
        max_execution_time: parseInt(
          process.env.CLICKHOUSE_MAX_EXECUTION_TIME ??
            DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME,
          10
        ),
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
export { getConnectionPoolStats }
