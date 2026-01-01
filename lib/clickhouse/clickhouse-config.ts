/**
 * ClickHouse Configuration
 * Parses environment variables and creates ClickHouse configurations
 */

import type { ClickHouseConfig } from './types'

import { debug, error } from '@/lib/logger'

export const getClickHouseHosts = () => {
  const hosts = (process.env.CLICKHOUSE_HOST || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  return hosts
}

function splitByComma(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const getClickHouseConfigs = (): ClickHouseConfig[] => {
  const hostEnv = process.env.CLICKHOUSE_HOST || ''
  const userEnv = process.env.CLICKHOUSE_USER || ''
  const passwordEnv = process.env.CLICKHOUSE_PASSWORD || ''
  const customNameEnv = process.env.CLICKHOUSE_NAME || ''

  // Debug logging for environment variables
  if (!hostEnv) {
    error(
      '[ClickHouse Config] CRITICAL: CLICKHOUSE_HOST environment variable is not set!'
    )
    error(
      '[ClickHouse Config] Available env keys:',
      Object.keys(process.env).filter((k) => k.includes('CLICK'))
    )
  } else {
    debug('[ClickHouse Config] CLICKHOUSE_HOST:', hostEnv)
    debug('[ClickHouse Config] CLICKHOUSE_USER:', userEnv ? '***' : '(empty)')
    debug(
      '[ClickHouse Config] CLICKHOUSE_PASSWORD:',
      passwordEnv ? '***' : '(empty)'
    )
    debug('[ClickHouse Config] CLICKHOUSE_NAME:', customNameEnv || '(empty)')
  }

  const hosts = splitByComma(hostEnv)
  const users = splitByComma(userEnv)
  const passwords = splitByComma(passwordEnv)
  const customLabels = splitByComma(customNameEnv)

  debug('[ClickHouse Config] Parsed hosts count:', hosts.length)

  if (hosts.length === 0) {
    error(
      '[ClickHouse Config] No hosts configured! Please set CLICKHOUSE_HOST environment variable.'
    )
    error('[ClickHouse Config] Example: CLICKHOUSE_HOST=http://localhost:8123')
    return []
  }

  return hosts.map((host, index) => {
    // User and password fallback to the first value,
    // supporting multiple hosts with the same user/password
    let user, password
    if (users.length === 1 && passwords.length === 1) {
      user = users[0]
      password = passwords[0]
    } else {
      user = users[index] || 'default'
      password = passwords[index] || ''
    }

    const config = {
      id: index,
      host,
      user,
      password,
      customName: customLabels[index],
    }

    debug(`[ClickHouse Config] Host ${index}:`, {
      id: config.id,
      host: config.host,
      user: config.user,
      hasPassword: !!config.password,
      customName: config.customName,
    })

    return config
  })
}
