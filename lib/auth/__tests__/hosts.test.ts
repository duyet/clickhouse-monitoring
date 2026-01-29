import {
  type AuthContext,
  getEnvHosts,
  getHost,
  getHosts,
  getPrimaryHost,
  isHostAccessible,
} from '../hosts'

describe('lib/auth/hosts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getEnvHosts', () => {
    it('should return empty array when no hosts configured', () => {
      delete process.env.CLICKHOUSE_HOST
      expect(getEnvHosts()).toEqual([])
    })

    it('should parse single host', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'
      process.env.CLICKHOUSE_USER = 'default'
      const hosts = getEnvHosts()

      expect(hosts).toHaveLength(1)
      expect(hosts[0]).toMatchObject({
        id: '0',
        host: 'localhost',
        username: 'default',
        source: 'env',
      })
    })

    it('should parse multiple hosts', () => {
      process.env.CLICKHOUSE_HOST = 'host1,host2,host3'
      process.env.CLICKHOUSE_USER = 'user1,user2,user3'
      const hosts = getEnvHosts()

      expect(hosts).toHaveLength(3)
      expect(hosts[0].host).toBe('host1')
      expect(hosts[1].host).toBe('host2')
      expect(hosts[2].host).toBe('host3')
    })

    it('should use custom names if provided', () => {
      process.env.CLICKHOUSE_HOST = 'host1,host2'
      process.env.CLICKHOUSE_USER = 'user1,user2'
      process.env.CLICKHOUSE_NAME = 'Production,Staging'
      const hosts = getEnvHosts()

      expect(hosts[0].name).toBe('Production')
      expect(hosts[1].name).toBe('Staging')
    })

    it('should generate default names if not provided', () => {
      process.env.CLICKHOUSE_HOST = 'host1,host2'
      delete process.env.CLICKHOUSE_NAME
      const hosts = getEnvHosts()

      expect(hosts[0].name).toBe('Host 0')
      expect(hosts[1].name).toBe('Host 1')
    })

    it('should use default username if not provided', () => {
      process.env.CLICKHOUSE_HOST = 'host1'
      delete process.env.CLICKHOUSE_USER
      const hosts = getEnvHosts()

      expect(hosts[0].username).toBe('default')
    })

    it('should handle whitespace in comma-separated values', () => {
      process.env.CLICKHOUSE_HOST = 'host1 , host2 , host3'
      process.env.CLICKHOUSE_USER = 'user1 , user2 , user3'
      const hosts = getEnvHosts()

      expect(hosts).toHaveLength(3)
      expect(hosts[0].host).toBe('host1')
      expect(hosts[1].host).toBe('host2')
      expect(hosts[2].username).toBe('user3')
    })

    it('should assign sequential IDs', () => {
      process.env.CLICKHOUSE_HOST = 'host1,host2,host3'
      const hosts = getEnvHosts()

      expect(hosts[0].id).toBe('0')
      expect(hosts[1].id).toBe('1')
      expect(hosts[2].id).toBe('2')
    })
  })

  describe('getHosts', () => {
    it('should return env hosts when auth is not enabled', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'
      process.env.CLICKHOUSE_USER = 'default'
      delete process.env.DATABASE_URL
      delete process.env.AUTH_SECRET

      const ctx: AuthContext = { session: null }
      const hosts = getHosts(ctx)

      expect(hosts).toHaveLength(1)
      expect(hosts[0].host).toBe('localhost')
    })

    it('should return env hosts for guest when enabled', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'
      process.env.CLICKHOUSE_USER = 'default'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'secret'
      process.env.ENV_HOSTS_VISIBILITY = 'all'

      const ctx: AuthContext = { session: null }
      const hosts = getHosts(ctx)

      expect(hosts).toHaveLength(1)
    })

    it('should return empty array for guest when visibility=guest', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'secret'
      process.env.ENV_HOSTS_VISIBILITY = 'guest'

      const ctx: AuthContext = {
        session: { userId: '1', email: 'user@example.com', role: 'member' },
      }
      const hosts = getHosts(ctx)

      expect(hosts).toEqual([])
    })

    it('should return env hosts for authenticated users', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'
      process.env.CLICKHOUSE_USER = 'default'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'secret'

      const ctx: AuthContext = {
        session: { userId: '1', email: 'user@example.com', role: 'member' },
      }
      const hosts = getHosts(ctx)

      expect(hosts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getHost', () => {
    it('should return host by ID', () => {
      process.env.CLICKHOUSE_HOST = 'host1,host2'
      process.env.CLICKHOUSE_USER = 'user1,user2'

      const ctx: AuthContext = { session: null }
      const host = getHost(ctx, '0')

      expect(host).toBeTruthy()
      expect(host?.host).toBe('host1')
    })

    it('should return null for non-existent host ID', () => {
      process.env.CLICKHOUSE_HOST = 'host1'

      const ctx: AuthContext = { session: null }
      const host = getHost(ctx, '999')

      expect(host).toBeNull()
    })

    it('should respect access control', () => {
      process.env.CLICKHOUSE_HOST = 'host1'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'secret'
      process.env.ENV_HOSTS_VISIBILITY = 'none'

      const ctx: AuthContext = {
        session: { userId: '1', email: 'user@example.com', role: 'member' },
      }
      const host = getHost(ctx, '0')

      expect(host).toBeNull()
    })
  })

  describe('isHostAccessible', () => {
    it('should return true for accessible host', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'

      const ctx: AuthContext = { session: null }
      const accessible = isHostAccessible(ctx, '0')

      expect(accessible).toBe(true)
    })

    it('should return false for inaccessible host', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'

      const ctx: AuthContext = { session: null }
      const accessible = isHostAccessible(ctx, '999')

      expect(accessible).toBe(false)
    })
  })

  describe('getPrimaryHost', () => {
    it('should return first host', () => {
      process.env.CLICKHOUSE_HOST = 'host1,host2,host3'
      process.env.CLICKHOUSE_NAME = 'Primary,Secondary,Tertiary'

      const ctx: AuthContext = { session: null }
      const host = getPrimaryHost(ctx)

      expect(host?.name).toBe('Primary')
      expect(host?.host).toBe('host1')
    })

    it('should return null when no hosts available', () => {
      delete process.env.CLICKHOUSE_HOST
      delete process.env.DATABASE_URL

      const ctx: AuthContext = { session: null }
      const host = getPrimaryHost(ctx)

      expect(host).toBeNull()
    })

    it('should respect access control', () => {
      process.env.CLICKHOUSE_HOST = 'localhost'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'secret'
      process.env.ENV_HOSTS_VISIBILITY = 'none'

      const ctx: AuthContext = {
        session: { userId: '1', email: 'user@example.com', role: 'member' },
      }
      const host = getPrimaryHost(ctx)

      expect(host).toBeNull()
    })
  })
})
