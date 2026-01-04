/**
 * Comprehensive test suite for table query handler factory
 *
 * Tests the createTableQueryHandler factory function which creates
 * standardized GET handlers for table/explorer API routes.
 *
 * @module lib/api/handlers/__tests__
 */

import { createTableQueryHandler } from '../table-query-handler'
import { getTableQuery } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'

// Mock dependencies
jest.mock('@/lib/api/table-registry')
jest.mock('@/lib/clickhouse')
jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  ErrorLogger: {
    logError: jest.fn(),
    logWarning: jest.fn(),
    logInfo: jest.fn(),
  },
}))

describe('createTableQueryHandler', () => {
  const mockRoute = '/api/v1/explorer/databases'
  const mockQueryConfigName = 'explorer-databases'
  const mockHostId = 0

  beforeEach(() => {
    jest.clearAllMocks()
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
      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)

      // Mock fetchData to return successful result
      jest.mocked(fetchData).mockResolvedValue({
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
      expect(getTableQuery).toHaveBeenCalledWith(mockQueryConfigName, {
        hostId: 0,
        searchParams: {},
      })
      expect(fetchData).toHaveBeenCalledWith({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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
      expect(getTableQuery).toHaveBeenCalledWith(mockQueryConfigName, {
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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
      jest.mocked(getTableQuery).mockReturnValue(null)

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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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

      jest.mocked(getTableQuery).mockReturnValue(mockQueryDef as never)
      jest.mocked(fetchData).mockResolvedValue({
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
