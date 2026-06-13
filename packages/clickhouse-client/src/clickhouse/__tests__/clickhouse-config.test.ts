import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock logger so tests don't pollute stdout
mock.module('@chm/logger', () => ({
  debug: mock(() => {}),
  error: mock(() => {}),
  warn: mock(() => {}),
}))

// _resetEnvCache is re-exported from clickhouse-config so it resets the SAME
// env-schema instance that the config functions use internally.
const {
  getClickHouseHosts,
  getClickHouseConfigs,
  getAndValidateClientConfig,
  redactHostCredentials,
  _resetEnvCache,
} = await import(
  new URL('../clickhouse-config.ts?test=config', import.meta.url).href
)

describe('getClickHouseHosts', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    _resetEnvCache()
  })

  afterAll(() => {
    process.env = originalEnv
    mock.restore()
  })

  it('returns empty array when CLICKHOUSE_HOST is not set', () => {
    delete process.env.CLICKHOUSE_HOST
    expect(getClickHouseHosts()).toEqual([])
  })

  it('returns a single host', () => {
    process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
    expect(getClickHouseHosts()).toEqual(['http://localhost:8123'])
  })

  it('returns multiple hosts from comma-separated value', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2,host3'
    expect(getClickHouseHosts()).toEqual(['host1', 'host2', 'host3'])
  })

  it('trims whitespace and filters empty entries', () => {
    process.env.CLICKHOUSE_HOST = ' host1 , , host2 ,  '
    expect(getClickHouseHosts()).toEqual(['host1', 'host2'])
  })

  it('returns empty array for whitespace-only value', () => {
    process.env.CLICKHOUSE_HOST = '    '
    // whitespace-only string gets split by comma, trimmed, filtered
    // "    ".split(',') -> ["    "], trimmed -> [""], filter(Boolean) -> []
    expect(getClickHouseHosts()).toEqual([])
  })

  it('returns empty array for comma-only value', () => {
    process.env.CLICKHOUSE_HOST = ',,,'
    expect(getClickHouseHosts()).toEqual([])
  })
})

describe('getClickHouseConfigs', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    _resetEnvCache()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns empty array when no hosts configured', () => {
    delete process.env.CLICKHOUSE_HOST
    expect(getClickHouseConfigs()).toEqual([])
  })

  it('returns a single config with defaults', () => {
    process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
    // user/password default to "default" and ""
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''

    const configs = getClickHouseConfigs()
    expect(configs).toHaveLength(1)
    expect(configs[0]).toEqual({
      id: 0,
      host: 'http://localhost:8123',
      user: 'default',
      password: '',
      customName: undefined,
    })
  })

  it('returns multiple configs from comma-separated hosts', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2,host3'
    process.env.CLICKHOUSE_USER = 'user1,user2,user3'
    process.env.CLICKHOUSE_PASSWORD = 'pw1,pw2,pw3'

    const configs = getClickHouseConfigs()
    expect(configs).toHaveLength(3)
    expect(configs[0].host).toBe('host1')
    expect(configs[0].user).toBe('user1')
    expect(configs[0].password).toBe('pw1')
    expect(configs[1].host).toBe('host2')
    expect(configs[1].user).toBe('user2')
    expect(configs[2].host).toBe('host3')
    expect(configs[2].user).toBe('user3')
  })

  it('shares first user/password across all hosts when only one is provided', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'shared_user'
    process.env.CLICKHOUSE_PASSWORD = 'shared_pw'

    const configs = getClickHouseConfigs()
    expect(configs).toHaveLength(2)
    // When both user and password have length === 1, the shared path is taken
    expect(configs[0].user).toBe('shared_user')
    expect(configs[0].password).toBe('shared_pw')
    expect(configs[1].user).toBe('shared_user')
    expect(configs[1].password).toBe('shared_pw')
  })

  it('falls back to "default" user when not enough user entries', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'only_one_user'
    process.env.CLICKHOUSE_PASSWORD = 'pw1,pw2'

    const configs = getClickHouseConfigs()
    // When users.length !== 1 or passwords.length !== 1, per-index fallback applies
    expect(configs[0].user).toBe('only_one_user')
    expect(configs[1].user).toBe('default') // fallback
  })

  it('falls back to empty password when not enough password entries', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'u1,u2'
    process.env.CLICKHOUSE_PASSWORD = 'only_one_pw'

    const configs = getClickHouseConfigs()
    expect(configs[0].password).toBe('only_one_pw')
    // users.length === 1 && passwords.length === 1 -> shared path
    // Actually no: users has 2, passwords has 1 -> per-index fallback
    expect(configs[1].password).toBe('')
  })

  it('assigns custom names from CLICKHOUSE_NAME', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''
    process.env.CLICKHOUSE_NAME = 'prod,staging'

    const configs = getClickHouseConfigs()
    expect(configs[0].customName).toBe('prod')
    expect(configs[1].customName).toBe('staging')
  })

  it('assigns sequential ids starting from 0', () => {
    process.env.CLICKHOUSE_HOST = 'h1,h2,h3'
    process.env.CLICKHOUSE_USER = 'u'
    process.env.CLICKHOUSE_PASSWORD = 'p'

    const configs = getClickHouseConfigs()
    expect(configs.map((c) => c.id)).toEqual([0, 1, 2])
  })
})

describe('getAndValidateClientConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    _resetEnvCache()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('throws when no hosts configured', () => {
    delete process.env.CLICKHOUSE_HOST
    expect(() => getAndValidateClientConfig(0)).toThrow(
      'No ClickHouse hosts configured'
    )
  })

  it('returns config for valid hostId', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''

    const config = getAndValidateClientConfig(0)
    expect(config.host).toBe('host1')
    expect(config.id).toBe(0)
  })

  it('returns config for hostId=1', () => {
    process.env.CLICKHOUSE_HOST = 'host1,host2'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''

    const config = getAndValidateClientConfig(1)
    expect(config.host).toBe('host2')
    expect(config.id).toBe(1)
  })

  it('throws for out-of-range hostId', () => {
    process.env.CLICKHOUSE_HOST = 'host1'
    process.env.CLICKHOUSE_USER = 'default'
    process.env.CLICKHOUSE_PASSWORD = ''

    expect(() => getAndValidateClientConfig(5)).toThrow('Invalid hostId: 5')
    expect(() => getAndValidateClientConfig(5)).toThrow('Available hosts: 0-0')
  })
})

describe('redactHostCredentials', () => {
  it('should leave host without credentials unchanged', () => {
    expect(redactHostCredentials('http://localhost:8123')).toBe(
      'http://localhost:8123/'
    )
  })

  it('should redact username and password from http URL', () => {
    expect(
      redactHostCredentials('http://admin:secret@clickhouse.prod:8123')
    ).toBe('http://***:***@clickhouse.prod:8123/')
  })

  it('should redact credentials from https URL', () => {
    expect(redactHostCredentials('https://user:pass123@clickhouse.prod')).toBe(
      'https://***:***@clickhouse.prod/'
    )
  })

  it('should handle invalid URLs gracefully', () => {
    expect(redactHostCredentials('invalid-url-string')).toBe(
      'invalid-url-string'
    )
  })
})
