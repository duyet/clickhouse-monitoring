/**
 * Comprehensive test suite for table query handler factory
 *
 * Tests the createTableQueryHandler factory function which creates
 * standardized GET handlers for table/explorer API routes.
 *
 * @module lib/api/handlers/__tests__
 */

import { createTableQueryHandler } from '../table-query-handler'
import {
  beforeEach as bunBeforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test'
import { ApiErrorType } from '@/lib/api/types'

// Mock dependencies
const mockGetTableQuery = mock(() => ({}))
const mockFetchData = mock(() =>
  Promise.resolve({ data: [], metadata: {}, error: null })
)
const mockDebug = mock(() => {})
const mockError = mock(() => {})
const mockInfo = mock(() => {})
const mockWarn = mock(() => {})
const mockLogError = mock(() => {})
const mockLogWarning = mock(() => {})
const mockLogInfo = mock(() => {})

mock.module('@/lib/api/table-registry', () => ({
  getTableQuery: mockGetTableQuery,
}))

mock.module('@/lib/clickhouse', () => ({
  fetchData: mockFetchData,
}))

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
  error: mockError,
  info: mockInfo,
  warn: mockWarn,
  ErrorLogger: {
    logError: mockLogError,
    logWarning: mockLogWarning,
    logInfo: mockLogInfo,
  },
}))

describe('createTableQueryHandler', () => {
  const mockRoute = '/api/v1/explorer/databases'
  const mockQueryConfigName = 'explorer-databases'
  const mockHostId = 0

  bunBeforeEach(() => {
    mockGetTableQuery.mockReset()
    mockFetchData.mockReset()
    mockDebug.mockReset()
    mockError.mockReset()
    mockInfo.mockReset()
    mockWarn.mockReset()
    mockLogError.mockReset()
    mockLogWarning.mockReset()
    mockLogInfo.mockReset()
  })

  describe('successful query execution', () => {
    it('should return data with correct response structure', async () => {
      const mockData = [
        { name: 'system', engine: 'Ordinary' },
        { name: 'default', engine: 'Ordinary' },
      ]
      const mockQueryDef = {
        query: 'SELECT name, engine FROM system.databases',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT name, engine FROM system.databases',
          columns: ['name', 'engine'],
        },
      }
      const mockMetadata = {
        queryId: 'q123',
        duration: 42,
        rows: 2,
        host: 'localhost',
      }

      // Mock getTableQuery to return a valid query definition
      mockGetTableQuery.mockReturnValue(mockQueryDef as never)

      // Mock fetchData to return successful result
      mockFetchData.mockResolvedValue({
        data: mockData,
        metadata: mockMetadata,
        error: null,
      } as never)

      // Create handler and execute request
      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(
        `http://localhost${mockRoute}?hostId=${mockHostId}`
      )
      const response = await handler(request)

      // Verify response structure
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=30, stale-while-revalidate=60'
      )

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        success: true,
        data: mockData,
        metadata: {
          queryId: 'q123',
          duration: 42,
          rows: 2,
          host: 'localhost',
        },
      })

      // Verify dependencies were called correctly
      expect(mockGetTableQuery).toHaveBeenCalledWith(mockQueryConfigName, {
        hostId: 0,
        searchParams: {},
      })
      expect(mockFetchData).toHaveBeenCalledWith({
        query: mockQueryDef.query,
        query_params: {},
        hostId: 0,
        format: 'JSONEachRow',
      })
    })

    it('should pass search params (excluding hostId) to query builder', async () => {
      const mockQueryDef = {
        query: 'SELECT * FROM system.tables WHERE database = {database:String}',
        queryParams: { database: 'system' },
        queryConfig: {
          name: 'explorer-tables',
          sql: 'SELECT * FROM system.tables WHERE database = {database:String}',
          columns: ['name'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: [],
        metadata: { queryId: 'q1', duration: 10, rows: 0, host: 'localhost' },
        error: null,
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(
        `http://localhost${mockRoute}?hostId=1&database=system&table=queries`
      )
      await handler(request)

      // Verify searchParams were passed correctly (excluding hostId)
      expect(mockGetTableQuery).toHaveBeenCalledWith(mockQueryConfigName, {
        hostId: 1,
        searchParams: { database: 'system', table: 'queries' },
      })
    })

    it('should handle empty result set', async () => {
      const mockQueryDef = {
        query: 'SELECT * FROM system.databases WHERE name = {name:String}',
        queryParams: { name: 'nonexistent' },
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT * FROM system.databases WHERE name = {name:String}',
          columns: ['name'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: [],
        metadata: { queryId: 'q1', duration: 5, rows: 0, host: 'localhost' },
        error: null,
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(
        `http://localhost${mockRoute}?hostId=0&name=nonexistent`
      )
      const response = await handler(request)

      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toEqual([])
      expect(responseBody.metadata.rows).toBe(0)
    })
  })

  describe('error handling - query build failures', () => {
    it('should return 500 when query definition cannot be built', async () => {
      // Mock getTableQuery to return null (query build failure)
      mockGetTableQuery.mockReturnValue(null)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: 'non-existent-query',
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      expect(response.status).toBe(500)
      const responseBody = await response.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.type).toBe(ApiErrorType.QueryError)
      expect(responseBody.error.message).toContain('Failed to build query')
    })
  })

  describe('error handling - ClickHouse errors', () => {
    it('should return 404 for TableNotFound', async () => {
      const mockQueryDef = {
        query: 'SELECT * FROM {database:String}.{table:String}',
        queryParams: { database: 'test', table: 'nonexistent' },
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT * FROM {database:String}.{table:String}',
          columns: ['name'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: null,
        metadata: {},
        error: {
          type: ApiErrorType.TableNotFound,
          message: 'Table test.nonexistent not found',
          details: { table: 'nonexistent', database: 'test' },
        },
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      expect(response.status).toBe(404)
      const responseBody = await response.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.type).toBe(ApiErrorType.TableNotFound)
    })

    it('should return 403 for PermissionError', async () => {
      const mockQueryDef = {
        query: 'SELECT * FROM system.databases',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT * FROM system.databases',
          columns: ['name'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: null,
        metadata: {},
        error: {
          type: ApiErrorType.PermissionError,
          message: 'Access denied',
          details: {},
        },
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      expect(response.status).toBe(403)
      const responseBody = await response.json()
      expect(responseBody.error.type).toBe(ApiErrorType.PermissionError)
    })

    it('should return 503 for NetworkError', async () => {
      const mockQueryDef = {
        query: 'SELECT * FROM system.databases',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT * FROM system.databases',
          columns: ['name'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: null,
        metadata: {},
        error: {
          type: ApiErrorType.NetworkError,
          message: 'Connection refused',
          details: {},
        },
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      expect(response.status).toBe(503)
      const responseBody = await response.json()
      expect(responseBody.error.type).toBe(ApiErrorType.NetworkError)
    })

    it('should return 500 for unknown error types', async () => {
      const mockQueryDef = {
        query: 'SELECT * FROM system.databases',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT * FROM system.databases',
          columns: ['name'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: null,
        metadata: {},
        error: {
          type: 'UnknownError',
          message: 'Something went wrong',
          details: {},
        },
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      expect(response.status).toBe(500)
    })
  })

  describe('response metadata', () => {
    it('should include correct metadata in success response', async () => {
      const mockQueryDef = {
        query: 'SELECT 1',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT 1',
          columns: ['1'],
        },
      }
      const mockMetadata = {
        queryId: 'test-query-id',
        duration: 123,
        rows: 42,
        host: 'clickhouse-01',
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: [{ 1: 1 }],
        metadata: mockMetadata,
        error: null,
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      const responseBody = await response.json()
      expect(responseBody.metadata).toEqual({
        queryId: 'test-query-id',
        duration: 123,
        rows: 42,
        host: 'clickhouse-01',
      })
    })

    it('should handle metadata with missing fields gracefully', async () => {
      const mockQueryDef = {
        query: 'SELECT 1',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT 1',
          columns: ['1'],
        },
      }
      const incompleteMetadata = {
        queryId: 'q1',
        // Missing duration, rows, host
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: [{ 1: 1 }],
        metadata: incompleteMetadata,
        error: null,
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      const responseBody = await response.json()
      // Should use default values for missing fields
      expect(responseBody.metadata).toEqual({
        queryId: 'q1',
        duration: 0,
        rows: 0,
        host: '',
      })
    })
  })

  describe('cache control headers', () => {
    it('should include standard cache control header', async () => {
      const mockQueryDef = {
        query: 'SELECT 1',
        queryParams: {},
        queryConfig: {
          name: mockQueryConfigName,
          sql: 'SELECT 1',
          columns: ['1'],
        },
      }

      mockGetTableQuery.mockReturnValue(mockQueryDef as never)
      mockFetchData.mockResolvedValue({
        data: [{ 1: 1 }],
        metadata: { queryId: 'q1', duration: 10, rows: 1, host: 'localhost' },
        error: null,
      } as never)

      const handler = createTableQueryHandler({
        route: mockRoute,
        queryConfigName: mockQueryConfigName,
      })

      const request = new Request(`http://localhost${mockRoute}?hostId=0`)
      const response = await handler(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toBe(
        'public, s-maxage=30, stale-while-revalidate=60'
      )
    })
  })
})
