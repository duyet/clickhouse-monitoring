import {
  afterAll,
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

// Import after mocks are registered so Bun does not cache the real modules
// before the stubs are in place.
const { _resetEnvCache } = await import(
  new URL('../clickhouse/env-schema.ts?test=clickhouse', import.meta.url).href
)
const { getClickHouseHosts, getClient } = await import(
  new URL('../index.ts?test=clickhouse', import.meta.url).href
)
const { clientPool } = await import(
  new URL('../clickhouse/connection-pool.ts?test=clickhouse', import.meta.url)
    .href
)

describe('getClickHouseHosts', () => {
  const originalEnv = { ...process.env }

  bunBeforeEach(() => {
    process.env = { ...originalEnv }
    _resetEnvCache() // Reset cached environment between tests
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
    _resetEnvCache() // Reset cached environment between tests
    clientPool.clear()
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
      url: 'localhost',
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
      url: 'localhost',
      username: 'default',
      password: '',
      clickhouse_settings: {
        max_execution_time: 60,
      },
    })
    expect(client).toBe(mockClient)
  })

  it('should default to the web client when web is undefined (Node/Docker regression guard)', async () => {
    // No `web` flag is how every production caller (fetchData,
    // fetchJsonEachRowAsNormalizedJson, /api/v1/explain) invokes getClient.
    // The node @clickhouse/client is stubbed out on both build targets, so a
    // node default throws at runtime — this is the Docker/k8s regression.
    // Defaulting to the web client (fetch-based, works on Node + Workers) is
    // the contract this test locks in.
    process.env.CLICKHOUSE_HOST = 'localhost'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''
    const mockClient = {}
    mockCreateClientWeb.mockReturnValue(mockClient)

    const client = await getClient({})

    expect(mockCreateClientWeb).toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
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
      url: 'localhost',
      username: 'testuser',
      password: 'testpassword',
      clickhouse_settings: {
        max_execution_time: 120,
      },
    })
    expect(client).toBe(mockClient)
  })
})
