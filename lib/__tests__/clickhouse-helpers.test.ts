/**
 * @fileoverview Tests for clickhouse-helpers wrapper functions
 * Tests edge cases and error scenarios for the fetchDataWithHost wrapper
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test'
import { fetchDataWithHost, validateHostId } from '@/lib/clickhouse-helpers'

// Mock the dependencies
const mockFetchData = mock(() =>
  Promise.resolve({
    data: [{ test: 'data' }],
    metadata: {
      queryId: 'test-id',
      duration: 100,
      rows: 1,
      host: 'test-host',
    },
  })
)

mock.module('@/lib/clickhouse', () => ({
  fetchData: mockFetchData,
}))

describe('fetchDataWithHost', () => {
  let consoleWarnSpy: ReturnType<typeof spyOn>
  let consoleErrorSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    // Reset all mocks before each test
    mockFetchData.mockReset()

    // Set default mock implementations
    mockFetchData.mockResolvedValue({
      data: [{ test: 'data' }],
      metadata: {
        queryId: 'test-id',
        duration: 100,
        rows: 1,
        host: 'test-host',
      },
    })

    // Spy on console methods
    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('hostId parameter handling', () => {
    it('should use provided hostId when passed explicitly', async () => {
      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 2,
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          hostId: 2,
        })
      )
      expect(result.data).toEqual([{ test: 'data' }])
    })

    it('should use hostId 0 by default', async () => {
      const result = await fetchDataWithHost({
        query: 'SELECT 1',
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          hostId: 0,
        })
      )
      expect(result.data).toEqual([{ test: 'data' }])
    })

    it('should validate and clamp negative hostId to 0', async () => {
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: -1,
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          hostId: 0,
        })
      )
    })

    it('should pass through validated hostId (no clamping)', async () => {
      // validateHostId validates the value is a non-negative integer
      // fetchDataWithHost doesn't clamp to available range - that happens elsewhere
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 5,
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          hostId: 5,
        })
      )
    })
  })

  describe('error handling', () => {
    it('should handle fetch errors and return structured error object', async () => {
      const error = new Error('Database connection failed')
      mockFetchData.mockRejectedValue(error)

      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('query_error')
      expect(result.error?.message).toBe('Database connection failed')
      expect(result.error?.details?.originalError).toBe(error)
    })

    it('should handle non-Error exceptions', async () => {
      mockFetchData.mockRejectedValue('String error')

      const result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('query_error')
      expect(result.error?.message).toBe('An unknown error occurred')
    })

    it('should pass through all query parameters', async () => {
      const queryParams = {
        query: 'SELECT * FROM table WHERE id = {id:UInt32}',
        query_params: { id: 123 },
        format: 'JSON' as const,
        clickhouse_settings: { max_execution_time: 30 },
        hostId: 1,
      }

      await fetchDataWithHost(queryParams)

      expect(mockFetchData).toHaveBeenCalledWith({
        query: queryParams.query,
        query_params: queryParams.query_params,
        format: queryParams.format,
        clickhouse_settings: queryParams.clickhouse_settings,
        hostId: 1,
      })
    })
  })

  describe('logging and warnings', () => {
    it('should log warning for invalid string hostId', async () => {
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 'not-a-number' as unknown as number,
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid hostId: not-a-number')
      )
    })

    it('should log warning for negative hostId', async () => {
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: -5,
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid hostId: -5')
      )
    })

    it('should log error when fetchData fails', async () => {
      const error = new Error('Test error')
      mockFetchData.mockRejectedValue(error)

      // fetchDataWithHost re-throws the error after logging
      await expect(
        fetchDataWithHost({
          query: 'SELECT 1',
          hostId: 0,
        })
      ).rejects.toThrow('Test error')

      // Structured logging outputs JSON containing error details
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in fetchDataWithHost')
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
