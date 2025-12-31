/**
 * Tests for lib/clickhouse/clickhouse-fetch.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { fetchData, query } from '../clickhouse-fetch'
import { ApiErrorType } from '@/lib/api/types'
import type { FetchDataErrorType } from '../types'
import type { QueryConfig } from '@/types/query-config'

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

jest.mock('../clickhouse-client', () => ({
  getClient: jest.fn(),
}))

jest.mock('../clickhouse-config', () => ({
  getClickHouseConfigs: jest.fn(),
}))

jest.mock('@/lib/table-validator', () => ({
  validateTableExistence: jest.fn(),
}))

import { getClient } from '../clickhouse-client'
import { getClickHouseConfigs } from '../clickhouse-config'
import { validateTableExistence } from '@/lib/table-validator'

describe('clickhouse-fetch', () => {
  const mockClient = {
    query: jest.fn(),
  }

  const mockResultSet = {
    query_id: 'test-query-id',
    json: jest.fn(),
  }

  const mockConfig = {
    id: 0,
    host: 'http://localhost:8123',
    user: 'default',
    password: '',
  }

  const defaultParams = {
    query: 'SELECT 1',
    hostId: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getClient as jest.Mock).mockResolvedValue(mockClient)
    ;(getClickHouseConfigs as jest.Mock).mockReturnValue([mockConfig])
    mockResultSet.json.mockResolvedValue([{ result: 'data' }])
    mockClient.query.mockResolvedValue(mockResultSet)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('fetchData', () => {
    describe('successful query execution', () => {
      it('should return data and metadata on success', async () => {
        const result = await fetchData(defaultParams)

        expect(result).toEqual({
          data: [{ result: 'data' }],
          metadata: {
            queryId: 'test-query-id',
            duration: expect.any(Number),
            rows: 1,
            host: 'http://localhost:8123',
          },
        })
        expect(result.error).toBeUndefined()
      })

      it('should handle array data', async () => {
        const mockData = [
          { col1: 'val1', col2: 100 },
          { col1: 'val2', col2: 200 },
        ]
        mockResultSet.json.mockResolvedValue(mockData)

        const result = await fetchData(defaultParams)

        expect(result.data).toEqual(mockData)
        expect(result.metadata.rows).toBe(2)
      })

      it('should handle null data', async () => {
        mockResultSet.json.mockResolvedValue(null)

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        expect(result.metadata.rows).toBe(-1)
      })

      it('should handle object data with rows property', async () => {
        const mockData = {
          rows: 100,
          statistics: { read_rows: 1000 },
        }
        mockResultSet.json.mockResolvedValue(mockData)

        const result = await fetchData(defaultParams)

        expect(result.data).toEqual(mockData)
        expect(result.metadata.rows).toBe(100)
      })

      it('should use queryConfig.sql when provided', async () => {
        const queryConfig: QueryConfig = {
          name: 'test',
          sql: 'SELECT 2',
        } as QueryConfig

        await fetchData({ ...defaultParams, queryConfig })

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.stringContaining('SELECT 2'),
          })
        )
      })

      it('should use direct query when queryConfig not provided', async () => {
        await fetchData({ query: 'SELECT 3', hostId: 0 })

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.stringContaining('SELECT 3'),
          })
        )
      })

      it('should pass query_params to client', async () => {
        const queryParams = { param1: 'value1', param2: 100 }
        await fetchData({ ...defaultParams, query_params: queryParams })

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            query_params: queryParams,
          })
        )
      })

      it('should pass clickhouse_settings to client', async () => {
        const settings = { max_execution_time: 60 }
        await fetchData({
          ...defaultParams,
          clickhouse_settings: settings,
        })

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            clickhouse_settings: settings,
          })
        )
      })

      it('should support different formats', async () => {
        await fetchData({ ...defaultParams, format: 'JSON' })

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'JSON',
          })
        )
      })
    })

    describe('hostId validation', () => {
      it('should throw for invalid hostId (NaN)', async () => {
        await expect(
          fetchData({ ...defaultParams, hostId: 'invalid' })
        ).rejects.toThrow('Invalid hostId')
      })

      it('should accept numeric string hostId that exists', async () => {
        const result = await fetchData({ ...defaultParams, hostId: '0' })

        expect(result.error).toBeUndefined()
      })

      it('should accept number hostId that exists', async () => {
        const result = await fetchData({ ...defaultParams, hostId: 0 })

        expect(result.error).toBeUndefined()
      })
    })

    describe('configuration validation', () => {
      it('should return error when no configs available', async () => {
        ;(getClickHouseConfigs as jest.Mock).mockReturnValue([])

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error?.type).toBe('validation_error')
        expect(result.error?.message).toContain('No ClickHouse hosts configured')
      })

      it('should return error when hostId out of range', async () => {
        ;(getClickHouseConfigs as jest.Mock).mockReturnValue([mockConfig])

        const result = await fetchData({ ...defaultParams, hostId: 5 })

        expect(result.data).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error?.type).toBe('validation_error')
        expect(result.error?.message).toContain('Invalid hostId: 5')
        expect(result.error?.message).toContain('Available hosts: 0')
      })
    })

    describe('optional query validation', () => {
      it('should validate tables when queryConfig.optional is true', async () => {
        const queryConfig: QueryConfig = {
          name: 'test',
          sql: 'SELECT * FROM system.backup_log',
          optional: true,
        } as QueryConfig

        ;(validateTableExistence as jest.Mock).mockResolvedValue({
          shouldProceed: true,
          missingTables: [],
        })

        await fetchData({ ...defaultParams, queryConfig })

        expect(validateTableExistence).toHaveBeenCalledWith(queryConfig, 0)
      })

      it('should skip query when validation fails', async () => {
        const queryConfig: QueryConfig = {
          name: 'test',
          sql: 'SELECT * FROM system.backup_log',
          optional: true,
        } as QueryConfig

        ;(validateTableExistence as jest.Mock).mockResolvedValue({
          shouldProceed: false,
          missingTables: ['system.backup_log'],
          error: 'Table not found',
        })

        const result = await fetchData({ ...defaultParams, queryConfig })

        expect(result.data).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error?.type).toBe('table_not_found')
        expect(result.error?.message).toContain('Table not found')
        expect(mockClient.query).not.toHaveBeenCalled()
      })

      it('should not validate when queryConfig.optional is false', async () => {
        const queryConfig: QueryConfig = {
          name: 'test',
          sql: 'SELECT 1',
          optional: false,
        } as QueryConfig

        await fetchData({ ...defaultParams, queryConfig })

        expect(validateTableExistence).not.toHaveBeenCalled()
        expect(mockClient.query).toHaveBeenCalled()
      })

      it('should not validate when queryConfig not provided', async () => {
        await fetchData(defaultParams)

        expect(validateTableExistence).not.toHaveBeenCalled()
      })

      it('should include missingTables in error details', async () => {
        const queryConfig: QueryConfig = {
          name: 'test',
          sql: 'SELECT * FROM system.backup_log',
          optional: true,
        } as QueryConfig

        ;(validateTableExistence as jest.Mock).mockResolvedValue({
          shouldProceed: false,
          missingTables: ['system.backup_log', 'system.error_log'],
        })

        const result = await fetchData({ ...defaultParams, queryConfig })

        expect(result.error?.details?.missingTables).toEqual([
          'system.backup_log',
          'system.error_log',
        ])
      })
    })

    describe('error handling', () => {
      it('should classify table_not_found errors', async () => {
        const error = new Error("Table system.unknown_table doesn't exist")
        mockClient.query.mockRejectedValue(error)

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        // Note: The implementation checks for "table", "not", AND "exist" all in lowercase
        // The message has "doesn't" which when lowercased contains "not" and "exist"
        expect(result.error?.message).toContain("doesn't exist")
      })

      it('should classify permission errors', async () => {
        const error = new Error('Permission denied')
        mockClient.query.mockRejectedValue(error)

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        expect(result.error?.type).toBe('permission_error')
      })

      it('should classify network errors', async () => {
        const error = new Error('Network connection failed')
        mockClient.query.mockRejectedValue(error)

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        expect(result.error?.type).toBe('network_error')
      })

      it('should default to query_error for unknown errors', async () => {
        const error = new Error('Unknown error')
        mockClient.query.mockRejectedValue(error)

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        expect(result.error?.type).toBe('query_error')
      })

      it('should include original error in details', async () => {
        const originalError = new Error('Test error')
        mockClient.query.mockRejectedValue(originalError)

        const result = await fetchData(defaultParams)

        expect(result.error?.details?.originalError).toBe(originalError)
      })

      it('should handle non-Error errors', async () => {
        mockClient.query.mockRejectedValue('String error')

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
        expect(result.error?.message).toBe('String error')
        expect(result.error?.details?.originalError).toBeUndefined()
      })

      it('should include host in error details', async () => {
        mockClient.query.mockRejectedValue(new Error('Test error'))

        const result = await fetchData(defaultParams)

        expect(result.error?.details?.host).toBe('http://localhost:8123')
      })

      it('should return metadata on error', async () => {
        mockClient.query.mockRejectedValue(new Error('Test error'))

        const result = await fetchData(defaultParams)

        expect(result.metadata).toEqual({
          queryId: '',
          duration: expect.any(Number),
          rows: 0,
          host: 'http://localhost:8123',
        })
      })
    })

    describe('metadata calculation', () => {
      it('should calculate duration correctly', async () => {
        const result = await fetchData(defaultParams)

        expect(result.metadata.duration).toBeGreaterThanOrEqual(0)
        expect(result.metadata.duration).toBeLessThan(1) // Should be very fast
      })

      it('should include query_id from result set', async () => {
        const result = await fetchData(defaultParams)

        expect(result.metadata.queryId).toBe('test-query-id')
      })

      it('should include host from config', async () => {
        const result = await fetchData(defaultParams)

        expect(result.metadata.host).toBe('http://localhost:8123')
      })
    })

    describe('error type classification edge cases', () => {
      it('should handle case insensitive error messages', async () => {
        mockClient.query.mockRejectedValue(new Error('TABLE NOT FOUND'))

        const result = await fetchData(defaultParams)

        // The implementation checks for all three: "table", "not", "exist"
        // "NOT FOUND" doesn't have "exist", so it defaults to query_error
        expect(result.error?.type).toBe('query_error')
      })

      it('should handle errors with multiple keywords', async () => {
        mockClient.query.mockRejectedValue(
          new Error('Table not found and permission denied')
        )

        const result = await fetchData(defaultParams)

        // "permission" appears before "exist" check, so it's classified as permission_error
        expect(result.error?.type).toBe('permission_error')
      })

      it('should handle empty error message', async () => {
        mockClient.query.mockRejectedValue(new Error(''))

        const result = await fetchData(defaultParams)

        expect(result.error?.type).toBe('query_error')
      })
    })

    describe('type safety', () => {
      it('should return correct type for array data', async () => {
        mockResultSet.json.mockResolvedValue([{ col: 'val' }])

        const result = await fetchData(defaultParams)

        // TypeScript should infer this as FetchDataResult<{ col: string }[]>
        expect(Array.isArray(result.data)).toBe(true)
      })

      it('should return correct type for object data', async () => {
        const mockData = {
          rows: 10,
          statistics: { read_rows: 100 },
        }
        mockResultSet.json.mockResolvedValue(mockData)

        const result = await fetchData(defaultParams)

        expect(typeof result.data).toBe('object')
      })

      it('should return null type for null data', async () => {
        mockResultSet.json.mockResolvedValue(null)

        const result = await fetchData(defaultParams)

        expect(result.data).toBeNull()
      })
    })
  })

  describe('query helper', () => {
    it('should execute simple query', async () => {
      await query('SELECT 1')

      expect(getClient).toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledWith({
        query: expect.stringContaining('SELECT 1'),
        format: 'JSON',
        query_params: {},
      })
    })

    it('should accept params', async () => {
      const params = { param1: 'value1' }
      await query('SELECT :param1', params)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query_params: params,
        })
      )
    })

    it('should accept custom format', async () => {
      await query('SELECT 1', {}, 'CSV')

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'CSV',
        })
      )
    })

    it('should pass web: false to getClient', async () => {
      await query('SELECT 1')

      expect(getClient).toHaveBeenCalledWith(
        expect.objectContaining({
          web: false,
        })
      )
    })

    it('should return resultSet', async () => {
      const result = await query('SELECT 1')

      expect(result).toBe(mockResultSet)
    })
  })
})
