/**
 * @fileoverview Tests for clickhouse-helpers wrapper functions
 * Tests edge cases and error scenarios for the fetchDataWithHost wrapper
 */

import { fetchDataWithHost, validateHostId } from '@/lib/clickhouse-helpers'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'

// Mock the dependencies
jest.mock('@/lib/clickhouse', () => ({
  fetchData: jest.fn(),
}))

jest.mock('@/lib/scoped-link', () => ({
  getHostIdCookie: jest.fn(),
}))

describe('fetchDataWithHost', () => {
  let mockFetchData: jest.Mock
  let mockGetHostIdCookie: jest.Mock

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Get mock references
    const clickhouse = require('@/lib/clickhouse')
    const scopedLink = require('@/lib/scoped-link')

    mockFetchData = clickhouse.fetchData as jest.Mock
    mockGetHostIdCookie = scopedLink.getHostIdCookie as jest.Mock

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

    mockGetHostIdCookie.mockResolvedValue(0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
      expect(mockGetHostIdCookie).not.toHaveBeenCalled()
      expect(result.data).toEqual([{ test: 'data' }])
    })

    it('should get hostId from cookie when not provided', async () => {
      mockGetHostIdCookie.mockResolvedValue(3)

      const result = await fetchDataWithHost({
        query: 'SELECT 1',
      })

      expect(mockGetHostIdCookie).toHaveBeenCalledWith(0)
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT 1',
          hostId: 3,
        })
      )
      expect(result.data).toEqual([{ test: 'data' }])
    })

    it('should handle string hostId and convert to number', async () => {
      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: '5',
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 5,
        })
      )
    })

    it('should use default hostId 0 for invalid string', async () => {
      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 'invalid',
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 0,
        })
      )
    })

    it('should use default hostId 0 for negative numbers', async () => {
      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: -1,
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 0,
        })
      )
    })

    it('should use default hostId 0 for non-integer numbers', async () => {
      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 1.5,
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 0,
        })
      )
    })

    it('should handle null hostId by getting from cookie', async () => {
      mockGetHostIdCookie.mockResolvedValue(4)

      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: null as any,
      })

      expect(mockGetHostIdCookie).toHaveBeenCalled()
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 4,
        })
      )
    })

    it('should handle undefined hostId by getting from cookie', async () => {
      mockGetHostIdCookie.mockResolvedValue(1)

      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: undefined,
      })

      expect(mockGetHostIdCookie).toHaveBeenCalled()
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 1,
        })
      )
    })

    it('should handle empty string hostId', async () => {
      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: '',
      })

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 0,
        })
      )
    })
  })

  describe('error handling', () => {
    it('should handle fetchData rejection gracefully', async () => {
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

    it('should handle getHostIdCookie rejection', async () => {
      const error = new Error('Cookie access denied')
      mockGetHostIdCookie.mockRejectedValue(error)

      // Should still work with default hostId
      const _result = await fetchDataWithHost({
        query: 'SELECT 1',
      })

      // Since getHostIdCookie fails but has a default, it should use 0
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 0,
        })
      )
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
    let consoleWarnSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should log warning for invalid string hostId', async () => {
      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 'not-a-number',
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

      await fetchDataWithHost({
        query: 'SELECT 1',
        hostId: 0,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in fetchDataWithHost:',
        error
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

  it('should parse valid string numbers', () => {
    expect(validateHostId('5')).toBe(5)
    expect(validateHostId('0')).toBe(0)
    expect(validateHostId('100')).toBe(100)
  })

  it('should return 0 for invalid strings', () => {
    expect(validateHostId('abc')).toBe(0)
    expect(validateHostId('1.5')).toBe(0)
    expect(validateHostId('')).toBe(0)
    expect(validateHostId(' ')).toBe(0)
  })

  it('should accept valid positive integers', () => {
    expect(validateHostId(0)).toBe(0)
    expect(validateHostId(1)).toBe(1)
    expect(validateHostId(999)).toBe(999)
  })

  it('should return 0 for negative numbers', () => {
    expect(validateHostId(-1)).toBe(0)
    expect(validateHostId(-100)).toBe(0)
  })

  it('should return 0 for non-integers', () => {
    expect(validateHostId(1.1)).toBe(0)
    expect(validateHostId(2.9)).toBe(0)
    expect(validateHostId(NaN)).toBe(0)
    expect(validateHostId(Infinity)).toBe(0)
  })

  it('should return 0 for objects and arrays', () => {
    expect(validateHostId({})).toBe(0)
    expect(validateHostId([])).toBe(0)
    expect(validateHostId({ hostId: 1 })).toBe(0)
    expect(validateHostId([1, 2, 3])).toBe(0)
  })

  it('should return 0 for boolean values', () => {
    expect(validateHostId(true as any)).toBe(0)
    expect(validateHostId(false as any)).toBe(0)
  })
})
