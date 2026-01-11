import {
  detectDatabaseAdapter,
  getAuthConfig,
  getDeploymentMode,
  isAuthEnabled,
  isCloudMode,
  isSelfHosted,
} from '../config'

describe('lib/auth/config', () => {
  // Save original env
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  describe('getDeploymentMode', () => {
    it('should default to self-hosted when not set', () => {
      delete process.env.DEPLOYMENT_MODE
      expect(getDeploymentMode()).toBe('self-hosted')
    })

    it('should return cloud when DEPLOYMENT_MODE=cloud', () => {
      process.env.DEPLOYMENT_MODE = 'cloud'
      expect(getDeploymentMode()).toBe('cloud')
    })

    it('should return self-hosted when DEPLOYMENT_MODE=self-hosted', () => {
      process.env.DEPLOYMENT_MODE = 'self-hosted'
      expect(getDeploymentMode()).toBe('self-hosted')
    })

    it('should be case-insensitive', () => {
      process.env.DEPLOYMENT_MODE = 'CLOUD'
      expect(getDeploymentMode()).toBe('cloud')

      process.env.DEPLOYMENT_MODE = 'Cloud'
      expect(getDeploymentMode()).toBe('cloud')
    })

    it('should default to self-hosted for invalid values', () => {
      process.env.DEPLOYMENT_MODE = 'invalid'
      expect(getDeploymentMode()).toBe('self-hosted')
    })
  })

  describe('detectDatabaseAdapter', () => {
    it('should return none when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL
      expect(detectDatabaseAdapter()).toBe('none')
    })

    it('should detect postgres from postgres:// scheme', () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost/db'
      expect(detectDatabaseAdapter()).toBe('postgres')
    })

    it('should detect postgres from postgresql:// scheme', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db'
      expect(detectDatabaseAdapter()).toBe('postgres')
    })

    it('should be case-insensitive for schemes', () => {
      process.env.DATABASE_URL = 'POSTGRES://user:pass@localhost/db'
      expect(detectDatabaseAdapter()).toBe('postgres')

      process.env.DATABASE_URL = 'PostgreSQL://user:pass@localhost/db'
      expect(detectDatabaseAdapter()).toBe('postgres')
    })

    it('should detect d1 from d1:// scheme', () => {
      process.env.DATABASE_URL = 'd1://binding-name'
      expect(detectDatabaseAdapter()).toBe('d1')
    })

    it('should detect d1 from d1 prefix', () => {
      process.env.DATABASE_URL = 'd1://some-value'
      expect(detectDatabaseAdapter()).toBe('d1')
    })

    it('should detect sqlite from file: scheme', () => {
      process.env.DATABASE_URL = 'file:./database.db'
      expect(detectDatabaseAdapter()).toBe('sqlite')
    })

    it('should detect sqlite from sqlite: scheme', () => {
      process.env.DATABASE_URL = 'sqlite://./database.db'
      expect(detectDatabaseAdapter()).toBe('sqlite')
    })

    it('should detect libsql from libsql:// scheme', () => {
      process.env.DATABASE_URL = 'libsql://token@host.turso.io'
      expect(detectDatabaseAdapter()).toBe('libsql')
    })

    it('should return none for unknown schemes', () => {
      process.env.DATABASE_URL = 'unknown://something'
      expect(detectDatabaseAdapter()).toBe('none')
    })
  })

  describe('isAuthEnabled', () => {
    it('should return false when no database adapter', () => {
      delete process.env.DATABASE_URL
      delete process.env.AUTH_SECRET
      expect(isAuthEnabled()).toBe(false)
    })

    it('should return false when database exists but no auth secret or oauth', () => {
      process.env.DATABASE_URL = 'postgres://localhost/db'
      delete process.env.AUTH_SECRET
      delete process.env.AUTH_GITHUB_ID
      delete process.env.AUTH_GOOGLE_ID
      expect(isAuthEnabled()).toBe(false)
    })

    it('should return true when database and AUTH_SECRET exist', () => {
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'my-secret'
      expect(isAuthEnabled()).toBe(true)
    })

    it('should return true when database and GitHub OAuth configured', () => {
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_GITHUB_ID = 'github-id'
      process.env.AUTH_GITHUB_SECRET = 'github-secret'
      delete process.env.AUTH_SECRET
      expect(isAuthEnabled()).toBe(true)
    })

    it('should return true when database and Google OAuth configured', () => {
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_GOOGLE_ID = 'google-id'
      process.env.AUTH_GOOGLE_SECRET = 'google-secret'
      delete process.env.AUTH_SECRET
      expect(isAuthEnabled()).toBe(true)
    })

    it('should return false when only partial OAuth configured', () => {
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_GITHUB_ID = 'github-id'
      delete process.env.AUTH_GITHUB_SECRET
      delete process.env.AUTH_SECRET
      expect(isAuthEnabled()).toBe(false)
    })
  })

  describe('getAuthConfig', () => {
    it('should return complete config with defaults', () => {
      delete process.env.DEPLOYMENT_MODE
      delete process.env.DATABASE_URL
      delete process.env.AUTH_SECRET

      const config = getAuthConfig()

      expect(config.deploymentMode).toBe('self-hosted')
      expect(config.databaseAdapter).toBe('none')
      expect(config.isEnabled).toBe(false)
      expect(config.hasAuthSecret).toBe(false)
      expect(config.hasOAuthConfig).toBe(false)
    })

    it('should return config with auth enabled', () => {
      process.env.DEPLOYMENT_MODE = 'cloud'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_SECRET = 'secret'

      const config = getAuthConfig()

      expect(config.deploymentMode).toBe('cloud')
      expect(config.databaseAdapter).toBe('postgres')
      expect(config.isEnabled).toBe(true)
      expect(config.hasAuthSecret).toBe(true)
      expect(config.hasOAuthConfig).toBe(false)
    })

    it('should detect all configuration parameters correctly', () => {
      process.env.DEPLOYMENT_MODE = 'cloud'
      process.env.DATABASE_URL = 'postgres://localhost/db'
      process.env.AUTH_GITHUB_ID = 'id'
      process.env.AUTH_GITHUB_SECRET = 'secret'

      const config = getAuthConfig()

      expect(config.hasOAuthConfig).toBe(true)
      expect(config.isEnabled).toBe(true)
    })
  })

  describe('isCloudMode', () => {
    it('should return true when deployment mode is cloud', () => {
      process.env.DEPLOYMENT_MODE = 'cloud'
      expect(isCloudMode()).toBe(true)
    })

    it('should return false when deployment mode is self-hosted', () => {
      process.env.DEPLOYMENT_MODE = 'self-hosted'
      expect(isCloudMode()).toBe(false)
    })

    it('should return false by default', () => {
      delete process.env.DEPLOYMENT_MODE
      expect(isCloudMode()).toBe(false)
    })
  })

  describe('isSelfHosted', () => {
    it('should return true when deployment mode is self-hosted', () => {
      process.env.DEPLOYMENT_MODE = 'self-hosted'
      expect(isSelfHosted()).toBe(true)
    })

    it('should return false when deployment mode is cloud', () => {
      process.env.DEPLOYMENT_MODE = 'cloud'
      expect(isSelfHosted()).toBe(false)
    })

    it('should return true by default', () => {
      delete process.env.DEPLOYMENT_MODE
      expect(isSelfHosted()).toBe(true)
    })
  })
})
