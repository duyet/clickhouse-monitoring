import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'

const mockCreateClient = mock(() => ({}))
const mockCreateClientWeb = mock(() => ({}))

mock.module('@clickhouse/client', () => ({
  createClient: mockCreateClient,
}))

mock.module('@clickhouse/client-web', () => ({
  createClient: mockCreateClientWeb,
}))

mock.module('@chm/logger', () => ({
  debug: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
}))

// Mock the cloudflare-workers runtime detection
const mockIsCloudflareWorkers = mock(() => false)
mock.module('../../runtime/cloudflare-workers', () => ({
  isCloudflareWorkers: mockIsCloudflareWorkers,
}))

const { _resetEnvCache } = await import(
  new URL('../env-schema.ts?test=client', import.meta.url).href
)
const { getClient, isCloudflareWorkers } = await import(
  new URL('../clickhouse-client.ts?test=client', import.meta.url).href
)
// Import connection-pool to clear between tests
const { clientPool } = await import(
  new URL('../connection-pool.ts?test=client', import.meta.url).href
)

describe('getClient', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''
    _resetEnvCache()
    clientPool.clear()
    mockCreateClient.mockReset()
    mockCreateClientWeb.mockReset()
    mockIsCloudflareWorkers.mockReset()
    mockIsCloudflareWorkers.mockReturnValue(false)
  })

  afterAll(() => {
    process.env = originalEnv
    mock.restore()
  })

  it('creates a standard client when web: false', async () => {
    const fakeClient = { query: mock(() => {}) }
    mockCreateClient.mockReturnValue(fakeClient)

    const client = await getClient({ web: false })

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost:8123',
        username: 'default',
        password: '',
      })
    )
    expect(mockCreateClientWeb).not.toHaveBeenCalled()
    expect(client).toBe(fakeClient)
  })

  it('creates a web client when web: true', async () => {
    const fakeClient = { query: mock(() => {}) }
    mockCreateClientWeb.mockReturnValue(fakeClient)

    const client = await getClient({ web: true })

    expect(mockCreateClientWeb).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost:8123',
        username: 'default',
        password: '',
      })
    )
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(client).toBe(fakeClient)
  })

  it('auto-detects cloudflare workers and uses web client', async () => {
    mockIsCloudflareWorkers.mockReturnValue(true)
    const fakeClient = { query: mock(() => {}) }
    mockCreateClientWeb.mockReturnValue(fakeClient)

    const client = await getClient({}) // no web flag

    expect(mockIsCloudflareWorkers).toHaveBeenCalled()
    expect(mockCreateClientWeb).toHaveBeenCalled()
    expect(client).toBe(fakeClient)
  })

  it('uses standard client when not on cloudflare and no web flag', async () => {
    const fakeClient = { query: mock(() => {}) }
    mockCreateClient.mockReturnValue(fakeClient)

    const client = await getClient({})

    expect(mockIsCloudflareWorkers).toHaveBeenCalled()
    expect(mockCreateClient).toHaveBeenCalled()
    expect(client).toBe(fakeClient)
  })

  it('passes max_execution_time from env', async () => {
    process.env.CLICKHOUSE_MAX_EXECUTION_TIME = '120'
    _resetEnvCache()
    mockCreateClient.mockReturnValue({})

    await getClient({ web: false })

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clickhouse_settings: expect.objectContaining({
          max_execution_time: 120,
        }),
      })
    )
  })

  it('merges custom clickhouseSettings', async () => {
    mockCreateClient.mockReturnValue({})

    await getClient({
      web: false,
      clickhouseSettings: { custom_setting: 'value' },
    })

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clickhouse_settings: expect.objectContaining({
          max_execution_time: 60,
          custom_setting: 'value',
        }),
      })
    )
  })

  it('accepts explicit clientConfig instead of using env', async () => {
    const fakeClient = { query: mock(() => {}) }
    mockCreateClient.mockReturnValue(fakeClient)

    const customConfig = {
      id: 99,
      host: 'http://custom-host:8123',
      user: 'custom_user',
      password: 'custom_pw',
    }

    const client = await getClient({ clientConfig: customConfig, web: false })

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://custom-host:8123',
        username: 'custom_user',
        password: 'custom_pw',
      })
    )
    expect(client).toBe(fakeClient)
  })

  it('reuses pooled client on second call with same config', async () => {
    const fakeClient = { query: mock(() => {}) }
    mockCreateClient.mockReturnValue(fakeClient)

    const client1 = await getClient({ web: false })
    const client2 = await getClient({ web: false })

    // Should only create one client
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    expect(client1).toBe(client2)
  })

  it('creates separate clients for web and non-web', async () => {
    mockCreateClient.mockReturnValue({ query: () => {} })
    mockCreateClientWeb.mockReturnValue({ query: () => {} })

    await getClient({ web: false })
    await getClient({ web: true })

    expect(mockCreateClient).toHaveBeenCalledTimes(1)
    expect(mockCreateClientWeb).toHaveBeenCalledTimes(1)
    expect(clientPool.size).toBe(2)
  })

  it('accepts hostId and resolves config', async () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'u1,u2'
    process.env.CLICKHOUSE_PASSWORD = 'p1,p2'
    _resetEnvCache()

    mockCreateClient.mockReturnValue({})

    await getClient({ hostId: 1, web: false })

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'host2',
        username: 'u2',
        password: 'p2',
      })
    )
  })
})

describe('isCloudflareWorkers re-export', () => {
  it('is re-exported from the module', () => {
    expect(typeof isCloudflareWorkers).toBe('function')
  })
})
