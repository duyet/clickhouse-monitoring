import { createClient } from '@clickhouse/client'
import { createClient as createClientWeb } from '@clickhouse/client-web'

import { getClickHouseHosts, getClient } from './clickhouse'
import {
  afterAll,
  beforeEach,
  beforeEach as bunBeforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test'

const mockCreateClient = mock(() => ({}))
const mockCreateClientWeb = mock(() => ({}))
const mockCookies = mock(() => ({}))

mock.module('@clickhouse/client', () => ({
  createClient: mockCreateClient,
}))

mock.module('@clickhouse/client-web', () => ({
  createClient: mockCreateClientWeb,
}))

mock.module('next/headers', () => ({
  cookies: mockCookies,
}))

describe('getClickHouseHosts', () => {
  const originalEnv = { ...process.env }

  bunBeforeEach(() => {
    process.env = { ...originalEnv }
    mockCreateClient.mockReset()
    mockCreateClientWeb.mockReset()
    mockCookies.mockReset()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return an empty array if CLICKHOUSE_HOST is not set', () => {
    delete process.env.CLICKHOUSE_HOST
    const result = getClickHouseHosts()
    expect(result).toEqual([])
  })

  it('should return an array with a single host', () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    const result = getClickHouseHosts()
    expect(result).toEqual(['localhost'])
  })

  it('should return an array with multiple hosts', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2,host3'
    const result = getClickHouseHosts()
    expect(result).toEqual(['host1', 'host2', 'host3'])
  })

  it('should trim hosts and filter out empty values', () => {
    process.env.CLICKHOUSE_HOST = ' host1 , , host2 ,  , host3 '
    const result = getClickHouseHosts()
    expect(result).toEqual(['host1', 'host2', 'host3'])
  })

  it('should handle environment variable with only spaces', () => {
    process.env.CLICKHOUSE_HOST = '    '
    const result = getClickHouseHosts()
    expect(result).toEqual([])
  })

  it('should handle environment variable with empty values', () => {
    process.env.CLICKHOUSE_HOST = ',,,'
    const result = getClickHouseHosts()
    expect(result).toEqual([])
  })
})

describe('getClient', () => {
  const originalEnv = { ...process.env }

  bunBeforeEach(() => {
    process.env = { ...originalEnv }
    mockCreateClient.mockReset()
    mockCreateClientWeb.mockReset()
    mockCookies.mockReset()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should create a ClickHouse client using the standard library', async () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''
    const mockClient = {}
    mockCreateClient.mockReturnValue(mockClient)

    const client = await getClient({ web: false })

    expect(mockCreateClient).toHaveBeenCalledWith({
      host: 'localhost',
      username: 'default',
      password: '',
      clickhouse_settings: {
        max_execution_time: 60,
      },
    })
    expect(client).toBe(mockClient)
  })

  it('should create a ClickHouse client using the web library', async () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''
    const mockClient = {}
    mockCreateClientWeb.mockReturnValue(mockClient)

    const client = await getClient({ web: true })

    expect(mockCreateClientWeb).toHaveBeenCalledWith({
      host: 'localhost',
      username: 'default',
      password: '',
      clickhouse_settings: {
        max_execution_time: 60,
      },
    })
    expect(client).toBe(mockClient)
  })

  it('should use environment variables for username, password, and max_execution_time', async () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    process.env.CLICKHOUSE_USER = 'testuser'
    process.env.CLICKHOUSE_PASSWORD = 'testpassword'
    process.env.CLICKHOUSE_MAX_EXECUTION_TIME = '120'

    const mockClient = {}
    mockCreateClient.mockReturnValue(mockClient)

    const client = await getClient({ web: false })

    expect(mockCreateClient).toHaveBeenCalledWith({
      host: 'localhost',
      username: 'testuser',
      password: 'testpassword',
      clickhouse_settings: {
        max_execution_time: 120,
      },
    })
    expect(client).toBe(mockClient)
  })
})
