/**
 * @fileoverview Tests for clickhouse-helpers wrapper functions
 * Tests edge cases and error scenarios for the fetchDataWithHost wrapper
 *
 * NOTE: We mock at the dependency level (clickhouse-client, clickhouse-config, etc.)
 * rather than mocking fetchData directly. This avoids Bun's global module mock
 * pollution issue and allows tests to run alongside clickhouse-fetch.test.ts.
 */

import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock at the dependency level - same as clickhouse-fetch.test.ts
// This ensures both test files can run together without mock conflicts

const mockDebug = mock(() => {})
const mockError = mock(() => {})
const mockWarn = mock(() => {})

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
  error: mockError,
  warn: mockWarn,
}))

const mockClientQuery = mock(() => Promise.resolve({}))
const mockResultSetJson = mock(() => Promise.resolve([{ test: 'data' }]))
const mockClient = {
  query: mockClientQuery,
}
const mockResultSet = {
  query_id: 'test-id',
  json: mockResultSetJson,
}

const mockGetClient = mock(() => Promise.resolve(mockClient))
const mockConfig = {
  id: 0,
  host: 'test-host',
  user: 'default',
  password: '',
}
const mockGetClickHouseConfigs = mock(() => [mockConfig])
const mockValidateTableExistence = mock(() =>
  Promise.resolve({ shouldProceed: true, missingTables: [] })
)

mock.module('@/lib/clickhouse/clickhouse-client', () => ({
  getClient: mockGetClient,
}))

mock.module('@/lib/clickhouse/clickhouse-config', () => ({
  getClickHouseConfigs: mockGetClickHouseConfigs,
}))

mock.module('@/lib/table-validator', () => ({
  validateTableExistence: mockValidateTableExistence,
}))

// Clean up module mocks after all tests
afterAll(() => {
  mock.restore()
})

// Import AFTER mocks are set up
import { fetchDataWithHost, validateHostId } from '@/lib/clickhouse-helpers'

describe('fetchDataWithHost', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockGetClient.mockReset()
    mockGetClickHouseConfigs.mockReset()
    mockValidateTableExistence.mockReset()
    mockClientQuery.mockReset()
    mockResultSetJson.mockReset()
    mockDebug.mockReset()
    mockError.mockReset()
    mockWarn.mockReset()

    // Set default mock implementations
    mockGetClient.mockResolvedValue(mockClient as never)
    mockGetClickHouseConfigs.mockReturnValue([mockConfig])
    mockValidateTableExistence.mockResolvedValue({
      shouldProceed: true,
      missingTables: [],
    })
    mockResultSetJson.mockResolvedValue([{ test: 'data' }])
    mockClientQuery.mockResolvedValue(mockResultSet as never)
  })

  describe('hostId parameter handling', () => {
    it('should use provided hostId when passed explicitly', async () => {
      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 0, // Use valid hostId that exists in mock configs
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.error).toBeUndefined()
    })

    it('should use hostId 0 by default', async () => {
      const result = await fetchDataWithHost({
        query: 'SELECT 1',
      })

      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.error).toBeUndefined()
    })

    it('should validate and clamp negative hostId to 0', async () => {
      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: -1,
      })

      // Should succeed because -1 gets clamped to 0
      expect(result.data).toEqual([{ test: 'data' }])
      expect(result.error).toBeUndefined()
    })

    it('should return error for out-of-range hostId', async () => {
      // validateHostId returns 5, but only 1 config exists (index 0)
      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 5,
      })

      // fetchData should return validation error for out-of-range hostId
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toContain('Invalid hostId: 5')
    })
  })

  describe('error handling', () => {
    it('should handle fetch errors and return structured error object', async () => {
      const error = new Error('Database connection failed')
      mockClientQuery.mockRejectedValue(error)

      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('Database connection failed')
    })

    it('should handle non-Error exceptions', async () => {
      mockClientQuery.mockRejectedValue('String error')

      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should pass through all query parameters', async () => {
      const queryParams = {
        query: 'SELECT * FROM table WHERE id = {id:UInt32}',
        query_params: { id: 123 },
        format: 'JSON' as const,
        clickhouse_settings: { max_execution_time: 30 },
        hostId: 0,
      }

      await fetchDataWithHost(queryParams)

      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('SELECT * FROM table'),
          query_params: { id: 123 },
          format: 'JSON',
          clickhouse_settings: { max_execution_time: 30 },
        })
      )
    })
  })

  describe('logging and warnings', () => {
    it('should log warning for invalid string hostId', async () => {
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 'not-a-number' as unknown as number,
      })

      // The structured logger is mocked at the module level
      // Warnings are logged through @/lib/logger.warn
      expect(mockWarn).toHaveBeenCalledWith(
        'Invalid hostId: not-a-number',
        expect.objectContaining({ component: 'validateHostId' })
      )
    })

    it('should log warning for negative hostId', async () => {
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: -5,
      })

      // Warnings go through the structured logger
      expect(mockWarn).toHaveBeenCalledWith(
        'Invalid hostId: -5',
        expect.objectContaining({ component: 'validateHostId' })
      )
    })
  })
})

describe('validateHostId', () => {
  it('should return 0 for undefined', () => {
    expect(validateHostId(undefined)).toBe(0)
  })

  it('should return 0 for null', () => {
    expect(validateHostId(null)).toBe(0)
  })

  it('should return 0 for empty string', () => {
    expect(validateHostId('')).toBe(0)
  })

  it('should return 0 for whitespace string', () => {
    expect(validateHostId('  ')).toBe(0)
  })

  it('should return 0 for negative numbers', () => {
    expect(validateHostId(-1)).toBe(0)
    expect(validateHostId(-100)).toBe(0)
  })

  it('should return 0 for NaN', () => {
    expect(validateHostId(NaN)).toBe(0)
  })

  it('should return 0 for Infinity', () => {
    expect(validateHostId(Infinity)).toBe(0)
  })

  it('should return 0 for decimal values (non-integer)', () => {
    // validateHostId only accepts integers, decimals return 0
    expect(validateHostId(1.5)).toBe(0)
    expect(validateHostId(2.9)).toBe(0)
  })

  it('should return 0 for invalid string values', () => {
    expect(validateHostId('abc' as unknown as number)).toBe(0)
  })

  it('should return the value for valid numbers', () => {
    expect(validateHostId(0)).toBe(0)
    expect(validateHostId(1)).toBe(1)
    expect(validateHostId(10)).toBe(10)
  })
})
