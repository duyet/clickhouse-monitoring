import { bridgeClickHouseEnv } from '../server-env'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

describe('bridgeClickHouseEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clear ClickHouse env keys from process.env before each test
    const keys = [
      'CLICKHOUSE_HOST',
      'CLICKHOUSE_USER',
      'CLICKHOUSE_PASSWORD',
      'CLICKHOUSE_NAME',
      'CLICKHOUSE_MAX_EXECUTION_TIME',
      'CLICKHOUSE_DATABASE',
      'EVENTS_TABLE_NAME',
    ]
    for (const key of keys) {
      delete process.env[key]
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should copy ClickHouse environment variables to process.env', () => {
    const mockBindings = {
      CLICKHOUSE_HOST: 'http://my-host:8123',
      CLICKHOUSE_USER: 'admin',
      CLICKHOUSE_PASSWORD: 'secretpassword',
      CLICKHOUSE_DATABASE: 'custom_db',
      EVENTS_TABLE_NAME: 'custom_events',
    }

    bridgeClickHouseEnv(mockBindings)

    expect(process.env.CLICKHOUSE_HOST).toBe('http://my-host:8123')
    expect(process.env.CLICKHOUSE_USER).toBe('admin')
    expect(process.env.CLICKHOUSE_PASSWORD).toBe('secretpassword')
    expect(process.env.CLICKHOUSE_DATABASE).toBe('custom_db')
    expect(process.env.EVENTS_TABLE_NAME).toBe('custom_events')
  })

  it('should not overwrite existing process.env values', () => {
    process.env.CLICKHOUSE_HOST = 'http://existing:8123'
    const mockBindings = {
      CLICKHOUSE_HOST: 'http://new-host:8123',
    }

    bridgeClickHouseEnv(mockBindings)

    expect(process.env.CLICKHOUSE_HOST).toBe('http://existing:8123')
  })
})
