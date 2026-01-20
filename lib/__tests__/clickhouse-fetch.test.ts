/**
 * Tests for lib/clickhouse/clickhouse-fetch.ts fetchData function
 */

import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock dependencies at module level
const mockDebug = mock(() => {})
const mockError = mock(() => {})
const mockWarn = mock(() => {})

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
  error: mockError,
  warn: mockWarn,
}))

// Mock clickhouse dependencies
const mockGetClickHouseConfigs = mock(() => [
  { id: 0, host: 'test-host', user: 'default', password: '' },
  { id: 1, host: 'test-host-2', user: 'default', password: '' },
])

const mockGetClickHouseVersion = mock(() => ({
  raw: '24.1.1',
  major: 24,
  minor: 1,
  patch: 1,
  build: 1,
  'clickhouse/official/stable': 'true',
}))

const mockSelectQueryVariantSemver = mock(() => 'SELECT 1')

const mockValidateTableExistence = mock(() =>
  Promise.resolve({ shouldProceed: true, missingTables: [] })
)

const mockResultSet = mock(() =>
  Promise.resolve({
    query_id: 'test-id',
    json: () => Promise.resolve([{ test: 'data' }]),
  })
)

const mockResultSetWithMetadata = mock(() =>
  Promise.resolve({
    query_id: 'test-id',
    json: () => Promise.resolve([{ test: 'data' }]),
    rows: 1,
    duration: 123,
    host: 'test-host',
    clickhouseVersion: '24.1.1',
    sql: 'SELECT 1',
    rawResponseLength: 1234,
    rawResponsePreview: 'query preview...',
  })
)

const mockClientQuery = mock(() => Promise.resolve(mockResultSetWithMetadata()))

const mockClient = {
  query: mockClientQuery,
}

const mockGetClient = mock(() => Promise.resolve(mockClient))

// Mock at module level for table-validator
mock.module('@/lib/table-validator', () => ({
  validateTableExistence: mockValidateTableExistence,
}))

// Mock at module level for client config
mock.module('@/lib/clickhouse/clickhouse-config', () => ({
  getClickHouseConfigs: mockGetClickHouseConfigs,
}))

// Mock at module level for client
mock.module('@/lib/clickhouse/clickhouse-client', () => ({
  getClient: mockGetClient,
}))

// Mock at module level for version detection
mock.module('@/lib/clickhouse-version', () => ({
  getClickHouseVersion: mockGetClickHouseVersion,
  selectQueryVariantSemver: mockSelectQueryVariantSemver,
  selectVersionedSql: (sql: any, version: any) =>
    Array.isArray(sql) ? sql[0].sql : sql,
}))

// Import after mocks are set up
import { fetchData } from '@/lib/clickhouse/clickhouse-fetch'
import type { QueryConfig } from '@/types/query-config'
import { QUERY_COMMENT } from '@/lib/clickhouse/constants'

describe('fetchData', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDebug.mockReset()
    mockError.mockReset()
    mockWarn.mockReset()
    mockGetClickHouseConfigs.mockReset()
    mockGetClickHouseVersion.mockReset()
    mockSelectQueryVariantSemver.mockReset()
    mockValidateTableExistence.mockReset()
    mockResultSet.mockReset()
    mockResultSetWithMetadata.mockReset()
    mockClientQuery.mockReset()
    mockGetClient.mockClear()

    // Default mock behaviors
    mockGetClickHouseConfigs.mockReturnValue([
      { id: 0, host: 'test-host', user: 'default', password: '' },
      { id: 1, host: 'test-host-2', user: 'default', password: '' },
    ])
    mockClientQuery.mockResolvedValue(mockResultSetWithMetadata())
  })

  describe('basic query parameter handling', () => {
    it('should accept query parameter', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.error).toBeUndefined()
      expect(result.metadata?.rows).toBe(1)
      expect(result.metadata?.host).toBe('test-host')
      expect(result.metadata?.queryId).toBe('test-id')
      expect(mockClientQuery).toHaveBeenCalledTimes(1)
    })

    it('should accept empty query_params', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        query_params: {},
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.error).toBeUndefined()
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT 1'),
          format: 'JSONEachRow',
          query_params: {},
          clickhouse_settings: expect.any(Object),
        })
      )
    })

    it('should accept format parameter', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        format: 'JSON' as const,
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT 1'),
          format: 'JSON',
        })
      )
    })

    it('should accept clickhouse_settings parameter', async () => {
      const settings = { max_execution_time: 30 }
      const result = await fetchData({
        query: 'SELECT 1',
        clickhouse_settings: settings,
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT 1'),
          format: 'JSONEachRow',
          clickhouse_settings: settings,
        })
      )
    })

    it('should accept multiple parameters', async () => {
      const result = await fetchData({
        query: 'SELECT :id',
        query_params: { id: 123 },
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT :id'),
          format: 'JSONEachRow',
          query_params: { id: 123 },
        })
      )
    })
  })

  describe('hostId parameter', () => {
    it('should accept number hostId', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 1,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.metadata?.host).toBe('test-host-2')
      expect(mockClientQuery).toHaveBeenCalled()
    })

    it('should accept string number hostId', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: '1' as unknown as number,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.metadata?.host).toBe('test-host-2')
    })

    it('should accept 0 as hostId', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.metadata?.host).toBe('test-host')
    })

    it('should throw for NaN hostId', async () => {
      await expect(
        fetchData({
          query: 'SELECT 1',
          hostId: NaN,
        })
      ).rejects.toThrow('Invalid hostId: NaN. Must be a valid number.')
    })

    it('should handle invalid hostId gracefully', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 999,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toContain('Invalid hostId: 999')
    })
  })

  describe('queryConfig parameter', () => {
    it('should pass through queryConfig to fetchData', async () => {
      const queryConfig: QueryConfig = {
        name: 'test-query',
        sql: 'SELECT 1',
      }
      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockGetClickHouseVersion).toHaveBeenCalled()
    })

    it('should validate optional tables when queryConfig.optional = true', async () => {
      mockValidateTableExistence.mockResolvedValue({
        shouldProceed: false,
        missingTables: ['system.missing_table'],
        error: 'Table does not exist',
      })

      const queryConfig: QueryConfig = {
        name: 'test-query',
        optional: true,
        sql: 'SELECT FROM system.missing_table',
      }

      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(mockValidateTableExistence).toHaveBeenCalledWith(queryConfig, 0)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('table_not_found')
      expect(result.error?.message).toContain('system.missing_table')
    })

    it('should skip validation for non-optional queries', async () => {
      const queryConfig: QueryConfig = {
        name: 'test-query',
        sql: 'SELECT 1',
      }

      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockValidateTableExistence).not.toHaveBeenCalled()
    })
  })

  describe('version detection and selection', () => {
    it('should get version for simple queries', async () => {
      const queryConfig: QueryConfig = {
        name: 'test-query',
        sql: 'SELECT version()',
      }

      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(mockGetClickHouseVersion).toHaveBeenCalledWith(0)
      expect(result.data).toEqual([{ test: 'data' }])
    })

    it('should use versioned queries with versions', async () => {
      const queryConfig: QueryConfig = {
        name: 'test-query',
        sql: [
          {
            since: '23.8',
            sql: 'SELECT 1 FROM old_table',
          },
          {
            since: '24.1',
            sql: 'SELECT 1 FROM new_table',
          },
        ],
      }

      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(mockGetClickHouseVersion).toHaveBeenCalled()
      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT 1 FROM'),
        })
      )
    })

    it('should use simple string sql', async () => {
      const queryConfig: QueryConfig = {
        name: 'test-query',
        sql: 'SELECT * FROM system.tables',
      }

      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT * FROM system.tables'),
        })
      )
    })
  })

  describe('success path - single row result', () => {
    it('should return data array with metadata', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual({ test: 'data' })

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.queryId).toBe('test-id')
      expect(result.metadata?.rows).toBe(1)
      expect(result.metadata?.duration).toBeGreaterThan(0)
      expect(result.metadata?.host).toBe('test-host')
      expect(result.metadata?.clickhouseVersion).toBe('24.1.1')
      expect(result.metadata?.sql).toBe('SELECT 1')
      expect(result.metadata?.rawResponseLength).toBeGreaterThan(0)
      expect(mockClientQuery).toHaveBeenCalledTimes(1)
    })

    it('should include query_id in metadata', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.metadata?.queryId).toBe('test-id')
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT 1'),
          format: 'JSONEachRow',
        })
      )
    })
  })

  describe('error handling - validation errors', () => {
    it('should return table_not_found error for missing tables', async () => {
      mockValidateTableExistence.mockResolvedValue({
        shouldProceed: false,
        missingTables: ['system.backup_log'],
      })

      const queryConfig: QueryConfig = {
        name: 'test-query',
        optional: true,
        sql: 'SELECT FROM system.backup_log',
      }

      const result = await fetchData({
        queryConfig,
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('table_not_found')
      expect(result.error?.message).toContain('backup_log')
      expect(result.error?.details?.missingTables).toEqual([
        'system.backup_log',
      ])
    })

    it('should return validation error when no configs', async () => {
      mockGetClickHouseConfigs.mockReturnValue([])

      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toContain('No ClickHouse hosts')
      expect(mockError).toHaveBeenCalled()
    })

    it('should return validation error for invalid hostId', async () => {
      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 999,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toContain('Invalid hostId: 999')
    })
  })

  describe('error handling - network errors', () => {
    it('should handle network errors', async () => {
      mockClientQuery.mockRejectedValue(new Error('Network connection failed'))

      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('network_error')
      expect(result.error?.message).toContain('Network connection failed')
      expect(mockError).toHaveBeenCalled()
    })

    it('should handle connection timeout', async () => {
      mockClientQuery.mockRejectedValue(
        new Error('Connection timeout after 30000ms')
      )

      const result = await fetchData({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('network_error')
    })
  })

  describe('error handling - query execution errors', () => {
    it('should handle query syntax errors', async () => {
      mockClientQuery.mockRejectedValue(
        new Error('Syntax error: failed at position 8 (line 1, col 8):')
      )

      const result = await fetchData({
        query: 'SELEC FROM',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('query_error')
      expect(result.error?.message).toContain('Syntax error')
      expect(mockError).toHaveBeenCalled()
    })

    it('should handle permission errors', async () => {
      mockClientQuery.mockRejectedValue(
        new Error('Access denied: User default has no permissions')
      )

      const result = await fetchData({
        query: 'SELECT * FROM system.users',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('permission_error')
      expect(result.error?.message).toContain('Access denied')
    })

    it('should handle table not found errors', async () => {
      mockClientQuery.mockRejectedValue(
        new Error('Table system.nonexistent_table does not exist')
      )

      const result = await fetchData({
        query: 'SELECT * FROM system.nonexistent_table',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('table_not_found')
    })
  })

  describe('error handling - invalid hostId errors', () => {
    it('should throw for NaN hostId', async () => {
      await expect(
        fetchData({
          query: 'SELECT 1',
          hostId: NaN,
        })
      ).rejects.toThrow('Invalid hostId: NaN. Must be a valid number.')
    })
  })
})
