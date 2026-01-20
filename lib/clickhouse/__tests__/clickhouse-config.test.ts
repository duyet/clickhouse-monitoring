/**
 * Tests for lib/clickhouse/clickhouse-config.ts
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock logger
const mockDebug = mock(() => {})
const mockError = mock(() => {})

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
  error: mockError,
}))

import {
  getClickHouseHosts,
  getClickHouseConfigs,
} from '@/lib/clickhouse/clickhouse-config'

describe('clickhouse-config', () => {
  describe('getClickHouseHosts', () => {
    it('should return empty array when CLICKHOUSE_HOST is not set', () => {
      const originalEnv = process.env.CLICKHOUSE_HOST
      delete process.env.CLICKHOUSE_HOST

      const hosts = getClickHouseHosts()

      expect(hosts).toEqual([])
      expect(hosts.length).toBe(0)

      if (originalEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should return empty array when CLICKHOUSE_HOST is empty string', () => {
      const originalEnv = process.env.CLICKHOUSE_HOST
      process.env.CLICKHOUSE_HOST = ''

      const hosts = getClickHouseHosts()

      expect(hosts).toEqual([])
      expect(hosts.length).toBe(0)

      if (originalEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should return single host', () => {
      const originalEnv = process.env.CLICKHOUSE_HOST
      process.env.CLICKHOUSE_HOST = 'http://localhost:8123'

      const hosts = getClickHouseHosts()

      expect(hosts).toEqual(['http://localhost:8123'])
      expect(hosts.length).toBe(1)

      if (originalEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should return multiple hosts', () => {
      const originalEnv = process.env.CLICKHOUSE_HOST
      process.env.CLICKHOUSE_HOST =
        'http://localhost:8123,http://host2:8123,http://host3:8123'

      const hosts = getClickHouseHosts()

      expect(hosts).toEqual([
        'http://localhost:8123',
        'http://host2:8123',
        'http://host3:8123',
      ])
      expect(hosts.length).toBe(3)

      if (originalEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should trim whitespace from hosts', () => {
      const originalEnv = process.env.CLICKHOUSE_HOST
      process.env.CLICKHOUSE_HOST =
        ' http://localhost:8123 , http://host2:8123 '

      const hosts = getClickHouseHosts()

      expect(hosts).toEqual(['http://localhost:8123', 'http://host2:8123'])
      expect(hosts.length).toBe(2)

      if (originalEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should filter out empty strings', () => {
      const originalEnv = process.env.CLICKHOUSE_HOST
      process.env.CLICKHOUSE_HOST = 'http://localhost:8123,,http://host2:8123,'

      const hosts = getClickHouseHosts()

      expect(hosts).toEqual(['http://localhost:8123', 'http://host2:8123'])
      expect(hosts.length).toBe(2)

      if (originalEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })
  })

  describe('getClickHouseConfigs', () => {
    beforeEach(() => {
      mockDebug.mockReset()
      mockError.mockReset()
    })

    it('should return empty array when no hosts configured', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      delete process.env.CLICKHOUSE_HOST

      const configs = getClickHouseConfigs()

      expect(configs).toEqual([])
      expect(configs.length).toBe(0)
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining(
          'CLICKHOUSE_HOST environment variable is not set'
        )
      )

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should return single config for single host', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
      process.env.CLICKHOUSE_USER = 'default'
      process.env.CLICKHOUSE_PASSWORD = ''
      delete process.env.CLICKHOUSE_NAME

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(1)
      expect(configs[0]).toEqual({
        id: 0,
        host: 'http://localhost:8123',
        user: 'default',
        password: '',
        customName: undefined,
      })

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should return multiple configs for multiple hosts', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST =
        'http://localhost:8123,http://host2:8123,http://host3:8123'
      process.env.CLICKHOUSE_USER = 'user1,user2,user3'
      process.env.CLICKHOUSE_PASSWORD = 'pass1,pass2,pass3'
      delete process.env.CLICKHOUSE_NAME

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(3)
      expect(configs[0]).toEqual({
        id: 0,
        host: 'http://localhost:8123',
        user: 'user1',
        password: 'pass1',
        customName: undefined,
      })
      expect(configs[1]).toEqual({
        id: 1,
        host: 'http://host2:8123',
        user: 'user2',
        password: 'pass2',
        customName: undefined,
      })
      expect(configs[2]).toEqual({
        id: 2,
        host: 'http://host3:8123',
        user: 'user3',
        password: 'pass3',
        customName: undefined,
      })

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should use default user/password when not provided', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
      delete process.env.CLICKHOUSE_USER
      delete process.env.CLICKHOUSE_PASSWORD
      delete process.env.CLICKHOUSE_NAME

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(1)
      expect(configs[0]).toEqual({
        id: 0,
        host: 'http://localhost:8123',
        user: 'default',
        password: '',
        customName: undefined,
      })

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should use single user/password for all hosts when only one provided', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD

      process.env.CLICKHOUSE_HOST =
        'http://localhost:8123,http://host2:8123,http://host3:8123'
      process.env.CLICKHOUSE_USER = 'single_user'
      process.env.CLICKHOUSE_PASSWORD = 'single_pass'

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(3)
      expect(configs[0].user).toBe('single_user')
      expect(configs[0].password).toBe('single_pass')
      expect(configs[1].user).toBe('single_user')
      expect(configs[1].password).toBe('single_pass')
      expect(configs[2].user).toBe('single_user')
      expect(configs[2].password).toBe('single_pass')

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
    })

    it('should handle custom names', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST = 'http://localhost:8123,http://host2:8123'
      process.env.CLICKHOUSE_USER = 'user1,user2'
      process.env.CLICKHOUSE_PASSWORD = 'pass1,pass2'
      process.env.CLICKHOUSE_NAME = 'Primary Host,Secondary Host'

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(2)
      expect(configs[0]).toEqual({
        id: 0,
        host: 'http://localhost:8123',
        user: 'user1',
        password: 'pass1',
        customName: 'Primary Host',
      })
      expect(configs[1]).toEqual({
        id: 1,
        host: 'http://host2:8123',
        user: 'user2',
        password: 'pass2',
        customName: 'Secondary Host',
      })

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should handle partial custom names', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST =
        'http://localhost:8123,http://host2:8123,http://host3:8123'
      process.env.CLICKHOUSE_USER = 'user1,user2,user3'
      process.env.CLICKHOUSE_PASSWORD = 'pass1,pass2,pass3'
      process.env.CLICKHOUSE_NAME = 'Primary Host,'

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(3)
      expect(configs[0].customName).toBe('Primary Host')
      expect(configs[1].customName).toBeUndefined()
      expect(configs[2].customName).toBeUndefined()

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should handle mixed user/password counts', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST = 'http://localhost:8123,http://host2:8123'
      process.env.CLICKHOUSE_USER = 'user1'
      process.env.CLICKHOUSE_PASSWORD = 'pass1,pass2'
      delete process.env.CLICKHOUSE_NAME

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(2)
      expect(configs[0]).toEqual({
        id: 0,
        host: 'http://localhost:8123',
        user: 'user1',
        password: 'pass1',
        customName: undefined,
      })
      expect(configs[1]).toEqual({
        id: 1,
        host: 'http://host2:8123',
        user: 'default',
        password: 'pass2',
        customName: undefined,
      })

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should log debug messages when configured', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
      process.env.CLICKHOUSE_USER = 'test_user'
      process.env.CLICKHOUSE_PASSWORD = 'test_pass'
      process.env.CLICKHOUSE_NAME = 'Test Host'

      getClickHouseConfigs()

      expect(mockDebug).toHaveBeenCalledWith(
        '[ClickHouse Config] CLICKHOUSE_HOST:',
        'http://localhost:8123'
      )
      expect(mockDebug).toHaveBeenCalledWith(
        '[ClickHouse Config] CLICKHOUSE_USER:',
        '***'
      )
      expect(mockDebug).toHaveBeenCalledWith(
        '[ClickHouse Config] CLICKHOUSE_PASSWORD:',
        '***'
      )
      expect(mockDebug).toHaveBeenCalledWith(
        '[ClickHouse Config] CLICKHOUSE_NAME:',
        'Test Host'
      )
      expect(mockDebug).toHaveBeenCalledWith(
        '[ClickHouse Config] Parsed hosts count:',
        1
      )

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })

    it('should log error when no hosts configured', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      delete process.env.CLICKHOUSE_HOST

      getClickHouseConfigs()

      expect(mockError).toHaveBeenCalledWith(
        '[ClickHouse Config] CRITICAL: CLICKHOUSE_HOST environment variable is not set!'
      )
      expect(mockError).toHaveBeenCalledWith(
        '[ClickHouse Config] Available env keys:',
        expect.any(Array)
      )

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
    })

    it('should handle whitespace in environment variables', () => {
      const originalHostEnv = process.env.CLICKHOUSE_HOST
      const originalUserEnv = process.env.CLICKHOUSE_USER
      const originalPasswordEnv = process.env.CLICKHOUSE_PASSWORD
      const originalNameEnv = process.env.CLICKHOUSE_NAME

      process.env.CLICKHOUSE_HOST =
        ' http://localhost:8123 , http://host2:8123 '
      process.env.CLICKHOUSE_USER = ' user1 , user2 '
      process.env.CLICKHOUSE_PASSWORD = ' pass1 , pass2 '
      delete process.env.CLICKHOUSE_NAME

      const configs = getClickHouseConfigs()

      expect(configs).toHaveLength(2)
      expect(configs[0]).toEqual({
        id: 0,
        host: 'http://localhost:8123',
        user: 'user1',
        password: 'pass1',
        customName: undefined,
      })
      expect(configs[1]).toEqual({
        id: 1,
        host: 'http://host2:8123',
        user: 'user2',
        password: 'pass2',
        customName: undefined,
      })

      if (originalHostEnv !== undefined) {
        process.env.CLICKHOUSE_HOST = originalHostEnv
      } else {
        delete process.env.CLICKHOUSE_HOST
      }
      if (originalUserEnv !== undefined) {
        process.env.CLICKHOUSE_USER = originalUserEnv
      } else {
        delete process.env.CLICKHOUSE_USER
      }
      if (originalPasswordEnv !== undefined) {
        process.env.CLICKHOUSE_PASSWORD = originalPasswordEnv
      } else {
        delete process.env.CLICKHOUSE_PASSWORD
      }
      if (originalNameEnv !== undefined) {
        process.env.CLICKHOUSE_NAME = originalNameEnv
      } else {
        delete process.env.CLICKHOUSE_NAME
      }
    })
  })
})
