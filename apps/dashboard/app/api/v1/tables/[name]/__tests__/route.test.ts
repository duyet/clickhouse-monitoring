import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const mockQueryConfig = {
  name: 'tables-overview',
  sql: 'SELECT 1',
  columns: ['table'],
  clickhouseSettings: {
    allow_experimental_analyzer: 0,
  },
}

function getMockQueryConfig(name: string) {
  if (name === 'metrics') {
    return {
      ...mockQueryConfig,
      name: 'metrics',
      permission: { feature: 'metrics' as const },
    }
  }

  return mockQueryConfig
}

const mockGetTableConfig = mock((name: string) => getMockQueryConfig(name))
const mockHasTable = mock(() => true)
const mockGetAvailableTables = mock(() => ['tables-overview'])
const mockGetTableQuery = mock(
  (name: string, params: { searchParams?: Record<string, string> }) => ({
    query: 'SELECT 1',
    queryParams:
      params.searchParams && Object.keys(params.searchParams).length > 0
        ? params.searchParams
        : undefined,
    queryConfig: getMockQueryConfig(name),
  })
)
const mockFetchData = mock(() =>
  Promise.resolve({
    data: [{ table: 'system.query_log' }],
    metadata: {
      queryId: 'query-1',
      duration: 0.01,
      rows: 1,
      host: 'localhost',
      clickhouseVersion: '25.1.1.1',
    },
  })
)

mock.module('@/lib/api/table-registry', () => ({
  getAvailableTables: mockGetAvailableTables,
  getTableConfig: mockGetTableConfig,
  getTableQuery: mockGetTableQuery,
  hasTable: mockHasTable,
}))

mock.module('@chm/clickhouse-client', () => ({
  fetchData: mockFetchData,
}))

let GET: (
  request: Request,
  context: { params: Promise<{ name: string }> }
) => Promise<Response>

beforeAll(async () => {
  const route = await import('../route')
  GET = route.GET
})

beforeEach(() => {
  mockGetTableConfig.mockClear()
  mockHasTable.mockClear()
  mockGetAvailableTables.mockClear()
  mockGetTableQuery.mockClear()
  mockFetchData.mockClear()
  mockFetchData.mockResolvedValue({
    data: [{ table: 'system.query_log' }],
    metadata: {
      queryId: 'query-1',
      duration: 0.01,
      rows: 1,
      host: 'localhost',
      clickhouseVersion: '25.1.1.1',
    },
  } as never)
})

describe('GET /api/v1/tables/[name]', () => {
  test('passes table result cap with config settings and timezone', async () => {
    const response = await GET(
      new Request(
        'http://localhost:3000/api/v1/tables/tables-overview?hostId=0&timezone=UTC'
      ),
      { params: Promise.resolve({ name: 'tables-overview' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockFetchData).toHaveBeenCalledWith(
      expect.objectContaining({
        hostId: 0,
        clickhouse_settings: {
          allow_experimental_analyzer: 0,
          session_timezone: 'UTC',
          max_result_rows: '1000',
          result_overflow_mode: 'break',
        },
      })
    )
    expect(body.metadata.resultRowLimit).toBe(1000)
    expect(body.metadata.resultOverflowMode).toBe('break')
    expect(body.metadata.resultRowsTruncated).toBe(false)
    expect(body.metadata.timezone).toBe('UTC')
  })

  test('trims rows above the API result cap', async () => {
    mockFetchData.mockResolvedValue({
      data: Array.from({ length: 1002 }, (_, index) => ({ id: index })),
      metadata: {
        queryId: 'query-1',
        duration: 0.01,
        rows: 1002,
        host: 'localhost',
        clickhouseVersion: '25.1.1.1',
      },
    } as never)

    const response = await GET(
      new Request(
        'http://localhost:3000/api/v1/tables/tables-overview?hostId=0'
      ),
      { params: Promise.resolve({ name: 'tables-overview' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1000)
    expect(body.metadata.rows).toBe(1000)
    expect(body.metadata.resultRowsBeforeCap).toBe(1002)
    expect(body.metadata.resultRowsTruncated).toBe(true)
  })

  test('keeps request search params flowing to query params', async () => {
    await GET(
      new Request(
        'http://localhost:3000/api/v1/tables/tables-overview?hostId=0&database=system&table=query_log'
      ),
      { params: Promise.resolve({ name: 'tables-overview' }) }
    )

    expect(mockFetchData).toHaveBeenCalledWith(
      expect.objectContaining({
        query_params: expect.objectContaining({
          database: 'system',
          table: 'query_log',
        }),
      })
    )
  })
})
