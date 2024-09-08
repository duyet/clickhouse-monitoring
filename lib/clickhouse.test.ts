import { afterAll, expect, jest } from '@jest/globals'
import { getClickHouseHosts, getClient } from './clickhouse'

import { createClient } from '@clickhouse/client'
import { createClient as createClientWeb } from '@clickhouse/client-web'

jest.mock('@clickhouse/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('@clickhouse/client-web', () => ({
  createClient: jest.fn(),
}))

describe('getClickHouseHosts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules() // Clears the module cache
    process.env = { ...originalEnv } // Restores the original environment variables
  })

  afterAll(() => {
    process.env = originalEnv // Restores the original environment variables
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
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules() // Clears the module cache
    process.env = { ...originalEnv } // Restores the original environment variables
  })

  afterAll(() => {
    process.env = originalEnv // Restores the original environment variables
  })

  it('should create a ClickHouse client using the standard library', () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    const mockClient = {}
    ;(createClient as jest.Mock).mockReturnValue(mockClient)

    const client = getClient({ web: false })

    expect(createClient).toHaveBeenCalledWith({
      host: 'localhost',
      username: 'default',
      password: '',
      clickhouse_settings: {
        max_execution_time: 60,
      },
    })
    expect(client).toBe(mockClient)
  })

  it('should create a ClickHouse client using the web library', () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    const mockClient = {}
    ;(createClientWeb as jest.Mock).mockReturnValue(mockClient)

    const client = getClient({ web: true })

    expect(createClientWeb).toHaveBeenCalledWith({
      host: 'localhost',
      username: 'default',
      password: '',
      clickhouse_settings: {
        max_execution_time: 60,
      },
    })
    expect(client).toBe(mockClient)
  })

  it('should use environment variables for username, password, and max_execution_time', () => {
    process.env.CLICKHOUSE_HOST = 'localhost'
    process.env.CLICKHOUSE_USER = 'testuser'
    process.env.CLICKHOUSE_PASSWORD = 'testpassword'
    process.env.CLICKHOUSE_MAX_EXECUTION_TIME = '120'

    const mockClient = {}
    ;(createClient as jest.Mock).mockReturnValue(mockClient)

    const client = getClient({ web: false })

    expect(createClient).toHaveBeenCalledWith({
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
