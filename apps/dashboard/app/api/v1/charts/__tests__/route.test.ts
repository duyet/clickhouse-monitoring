import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { mockAuthorizeFeatureRequest } from '@/app/api/v1/__tests__/feature-permissions-mock'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetchJson = mock(() =>
  Promise.resolve({
    dataJson: '[{"event_time":"2025-01-01","count":"5"}]',
    metadata: { queryId: 'q1', duration: 10, rows: 1, host: '0' },
  })
)

const mockGetClickHouseVersion = mock(() =>
  Promise.resolve({ raw: '24.1.1.1', major: 24, minor: 1 })
)
const mockSelectVersionedSql = mock(
  (sql: unknown[]) => (sql as { sql: string }[])[0].sql
)
const mockSelectQueryVariant = mock(() => 'SELECT 1')
const mockCheckTableAvailability = mock(() =>
  Promise.resolve({ exists: true, hasData: true })
)
const mockGetTableInfoMessage = mock(
  (t: string) => `Table ${t} is not available`
)

mock.module('@chm/clickhouse-client', () => ({
  fetchJsonEachRowAsNormalizedJson: mockFetchJson,
  fetchData: mock(() => Promise.resolve({ data: [], metadata: {} })),
  getClient: mock(() =>
    Promise.resolve({
      query: mock(() => Promise.resolve()),
      command: mock(() => Promise.resolve()),
    })
  ),
}))

mock.module('@chm/clickhouse-client/clickhouse-version', () => ({
  getClickHouseVersion: mockGetClickHouseVersion,
  selectVersionedSql: mockSelectVersionedSql,
  selectQueryVariant: mockSelectQueryVariant,
  checkTableAvailability: mockCheckTableAvailability,
  getTableInfoMessage: mockGetTableInfoMessage,
}))

const mockHasChart = mock(() => true)
const mockGetChartQuery = mock(() => ({
  query: 'SELECT 1',
  queryParams: undefined,
}))
const mockGetAvailableCharts = mock(() => ['test-chart'])

mock.module('@/lib/api/chart-registry', () => ({
  hasChart: mockHasChart,
  getChartQuery: mockGetChartQuery,
  getAvailableCharts: mockGetAvailableCharts,
}))

// ── Import route after mocks ───────────────────────────────────────────────────

let GET: (
  request: Request,
  context: { params: Promise<{ name: string }> }
) => Promise<Response>

beforeAll(async () => {
  const route = await import('../[name]/route')
  GET = route.GET
})

beforeEach(() => {
  mockFetchJson.mockClear()
  mockGetClickHouseVersion.mockClear()
  mockSelectVersionedSql.mockClear()
  mockSelectQueryVariant.mockClear()
  mockCheckTableAvailability.mockClear()
  mockHasChart.mockClear()
  mockGetChartQuery.mockClear()
  mockGetAvailableCharts.mockClear()
  mockAuthorizeFeatureRequest.mockClear()

  // Bypass feature permission checks in route tests
  mockAuthorizeFeatureRequest.mockResolvedValue(null)

  // Reset default resolved values
  mockFetchJson.mockResolvedValue({
    dataJson: '[{"event_time":"2025-01-01","count":"5"}]',
    metadata: { queryId: 'q1', duration: 10, rows: 1, host: '0' },
  })
  mockHasChart.mockReturnValue(true)
  mockGetChartQuery.mockReturnValue({
    query: 'SELECT event_time, count FROM system.query_log',
    queryParams: undefined,
    permission: { feature: 'metrics' },
  })
  mockGetClickHouseVersion.mockResolvedValue({
    raw: '24.1.1.1',
    major: 24,
    minor: 1,
  })
  mockCheckTableAvailability.mockResolvedValue({ exists: true, hasData: true })
})

// ── Helpers ────────────────────────────────────────────────────────────────────

function chartUrl(name: string, extra = '') {
  return `http://localhost:3000/api/v1/charts/${name}?hostId=0${extra ? `&${extra}` : ''}`
}

function chartRequest(name: string, extra = '') {
  return new Request(chartUrl(name, extra))
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /api/v1/charts/[name]', () => {
  test('returns 200 with chart data for a valid single-query chart', async () => {
    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.metadata).toBeDefined()
    expect(body.metadata.queryId).toBe('q1')
  })

  test('passes timezone to fetchJson as clickhouse_settings', async () => {
    await GET(chartRequest('test-chart', 'timezone=UTC'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        clickhouse_settings: { session_timezone: 'UTC' },
      })
    )
  })

  test('passes valid interval through to query builder', async () => {
    await GET(chartRequest('test-chart', 'interval=toStartOfTenMinutes'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({
        interval: 'toStartOfTenMinutes',
      })
    )
  })

  test('passes valid lastHours to query builder', async () => {
    await GET(chartRequest('test-chart', 'lastHours=48'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ lastHours: 48 })
    )
  })

  test('rejects invalid interval silently (passes undefined)', async () => {
    await GET(chartRequest('test-chart', 'interval=DROP TABLE'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ interval: undefined })
    )
  })

  test('rejects non-numeric lastHours (passes undefined)', async () => {
    await GET(chartRequest('test-chart', 'lastHours=abc'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ lastHours: undefined })
    )
  })

  test('rejects negative lastHours (passes undefined)', async () => {
    await GET(chartRequest('test-chart', 'lastHours=-5'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ lastHours: undefined })
    )
  })

  test('returns 404 when chart name is not in registry', async () => {
    mockHasChart.mockReturnValue(false)

    const res = await GET(chartRequest('nonexistent-chart'), {
      params: Promise.resolve({ name: 'nonexistent-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.type).toBe('table_not_found')
  })

  test('returns 500 when query builder returns null', async () => {
    mockGetChartQuery.mockReturnValue(null)

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.type).toBe('query_error')
  })

  test('uses VersionedSql when sql array is present on query def', async () => {
    mockGetChartQuery.mockReturnValue({
      sql: [
        { since: '23.8', sql: 'SELECT old_col FROM t' },
        { since: '24.1', sql: 'SELECT new_col FROM t' },
      ],
      query: 'SELECT fallback FROM t',
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.status).toBe(200)
    expect(mockSelectVersionedSql).toHaveBeenCalled()
    expect(mockSelectQueryVariant).not.toHaveBeenCalled()
  })

  test('uses deprecated variants when present and no sql array', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT fallback FROM t',
      variants: [
        { versions: { minVersion: '23.0' }, query: 'SELECT v1 FROM t' },
      ],
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.status).toBe(200)
    expect(mockSelectQueryVariant).toHaveBeenCalled()
    expect(mockSelectVersionedSql).not.toHaveBeenCalled()
  })

  test('falls back to query string when no sql or variants', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT simple FROM t',
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.status).toBe(200)
    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'SELECT simple FROM t' })
    )
  })

  test('returns error response when fetchJson returns an error', async () => {
    mockFetchJson.mockResolvedValue({
      error: {
        type: 'query_error',
        message: 'Syntax error in query',
        details: undefined,
      },
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Syntax error')
  })

  test('maps network_error to 503 status code', async () => {
    mockFetchJson.mockResolvedValue({
      error: {
        type: 'network_error',
        message: 'Connection refused',
        details: undefined,
      },
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.status).toBe(503)
  })

  test('maps timeout_error to 504 status code', async () => {
    mockFetchJson.mockResolvedValue({
      error: {
        type: 'timeout_error',
        message: 'Query timed out',
        details: undefined,
      },
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.status).toBe(504)
  })

  test('maps validation_error to 400 status code', async () => {
    mockFetchJson.mockResolvedValue({
      error: {
        type: 'validation_error',
        message: 'Invalid params',
        details: undefined,
      },
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.status).toBe(400)
  })

  test('returns empty data with table_not_found status when optional table does not exist', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT * FROM system.backup_log',
      optional: true,
      tableCheck: 'system.backup_log',
    })
    mockCheckTableAvailability.mockResolvedValue({
      exists: false,
      hasData: false,
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.metadata.status).toBe('table_not_found')
    expect(body.data).toEqual([])
  })

  test('returns table_empty status when table exists but has no data', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT * FROM system.backup_log',
      optional: true,
      tableCheck: 'system.backup_log',
    })
    mockCheckTableAvailability.mockResolvedValue({
      exists: true,
      hasData: false,
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.metadata.status).toBe('table_empty')
  })

  test('returns empty status when query returns zero rows', async () => {
    mockFetchJson.mockResolvedValue({
      dataJson: '[]',
      metadata: { queryId: 'q1', duration: 5, rows: 0, host: '0' },
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.metadata.status).toBe('empty')
  })

  test('sets correct Cache-Control for realtime policy', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT 1',
      cachePolicy: 'realtime',
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=10, stale-while-revalidate=30'
    )
  })

  test('sets correct Cache-Control for historical policy', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT 1',
      cachePolicy: 'historical',
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=120, stale-while-revalidate=300'
    )
  })

  test('sets default Cache-Control when no policy specified', async () => {
    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=30, stale-while-revalidate=60'
    )
  })
})

describe('GET /api/v1/charts/[name] — multi-query charts', () => {
  beforeEach(() => {
    mockGetChartQuery.mockReturnValue({
      queries: [
        {
          key: 'running',
          query: 'SELECT COUNT() as count FROM system.processes',
        },
        {
          key: 'total',
          query: 'SELECT COUNT() as count FROM system.query_log',
        },
      ],
      cachePolicy: 'realtime' as const,
    })
  })

  test('returns combined data for multi-query charts', async () => {
    const res = await GET(chartRequest('summary-chart'), {
      params: Promise.resolve({ name: 'summary-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.running).toBeDefined()
    expect(body.data.total).toBeDefined()
    expect(body.metadata.sql).toContain('Query 1: running')
    expect(body.metadata.sql).toContain('Query 2: total')
  })

  test('returns error in response but still 200 when a sub-query fails', async () => {
    mockFetchJson
      .mockResolvedValueOnce({
        dataJson: '[{"count":"5"}]',
        metadata: { queryId: 'q1', duration: 1, rows: 1, host: '0' },
      })
      .mockResolvedValueOnce({
        error: { type: 'query_error', message: 'Table not found' },
      })

    const res = await GET(chartRequest('summary-chart'), {
      params: Promise.resolve({ name: 'summary-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.message).toContain('Table not found')
  })

  test('returns success=false with error when all sub-queries throw', async () => {
    mockFetchJson.mockRejectedValue(new Error('Connection lost'))

    const res = await GET(chartRequest('summary-chart'), {
      params: Promise.resolve({ name: 'summary-chart' }),
    })
    const body = await res.json()

    // Individual sub-query exceptions are caught per-query, so outer handler returns 200
    expect(res.status).toBe(200)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Connection lost')
  })

  test('handles individual sub-query exception gracefully', async () => {
    mockFetchJson.mockRejectedValueOnce(new Error('Query 1 crashed'))

    const res = await GET(chartRequest('summary-chart'), {
      params: Promise.resolve({ name: 'summary-chart' }),
    })
    const body = await res.json()

    // Individual query errors are caught and returned as null data with error
    expect(res.status).toBe(200)
    // The first query failed, so success is false
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })
})

describe('GET /api/v1/charts/[name] — params handling', () => {
  test('passes valid JSON params to query builder', async () => {
    await GET(chartRequest('test-chart', 'params={"database":"system"}'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({
        params: { database: 'system' },
      })
    )
  })

  test('ignores invalid JSON params silently', async () => {
    await GET(chartRequest('test-chart', 'params=not-json'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ params: undefined })
    )
  })

  test('ignores array JSON params silently', async () => {
    await GET(chartRequest('test-chart', 'params=[1,2,3]'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ params: undefined })
    )
  })

  test('ignores null JSON params silently', async () => {
    await GET(chartRequest('test-chart', 'params=null'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockGetChartQuery).toHaveBeenCalledWith(
      'test-chart',
      expect.objectContaining({ params: undefined })
    )
  })
})

describe('GET /api/v1/charts/[name] — timezone validation', () => {
  test('accepts valid IANA timezone', async () => {
    await GET(chartRequest('test-chart', 'timezone=America/New_York'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        clickhouse_settings: { session_timezone: 'America/New_York' },
      })
    )
  })

  test('ignores invalid timezone silently', async () => {
    await GET(chartRequest('test-chart', 'timezone=Invalid/Zone'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })

    expect(mockFetchJson).toHaveBeenCalledWith(
      expect.objectContaining({ clickhouse_settings: undefined })
    )
  })
})

describe('GET /api/v1/charts/[name] — tableCheck as array', () => {
  test('handles tableCheck as string array, using first element', async () => {
    mockGetChartQuery.mockReturnValue({
      query: 'SELECT * FROM system.backup_log',
      optional: true,
      tableCheck: ['system.backup_log', 'system.backup_settings'],
    })
    mockCheckTableAvailability.mockResolvedValue({
      exists: false,
      hasData: false,
    })

    const res = await GET(chartRequest('test-chart'), {
      params: Promise.resolve({ name: 'test-chart' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.metadata.status).toBe('table_not_found')
    expect(mockCheckTableAvailability).toHaveBeenCalledWith(
      0,
      'system',
      'backup_log'
    )
  })
})
