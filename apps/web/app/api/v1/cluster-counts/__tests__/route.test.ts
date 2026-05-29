import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetchData = mock(() =>
  Promise.resolve({
    data: [{ count: 42 }],
    metadata: { queryId: 'q1', duration: 5, rows: 1, host: '0' },
  })
)

mock.module('@chm/clickhouse-client', () => ({
  fetchData: mockFetchData,
  fetchJsonEachRowAsNormalizedJson: mock(() =>
    Promise.resolve({ dataJson: '[]', metadata: {} })
  ),
  getClient: mock(() =>
    Promise.resolve({
      query: mock(() => Promise.resolve()),
      command: mock(() => Promise.resolve()),
    })
  ),
}))

const mockHasClusterCountKey = mock(() => true)
const mockGetClusterCountQuery = mock(() => ({
  query:
    'SELECT COUNT() as count FROM clusterAllReplicas({cluster: String}, system.replicas) WHERE is_readonly = 1',
}))

mock.module('@/lib/api/cluster-count-registry', () => ({
  hasClusterCountKey: mockHasClusterCountKey,
  getClusterCountQuery: mockGetClusterCountQuery,
}))

mock.module('@/lib/feature-permissions/server', () => ({
  authorizeFeatureRequest: () => Promise.resolve(null),
}))

// ── Import route after mocks ───────────────────────────────────────────────────

let GET: (
  request: Request,
  context: { params: Promise<{ key: string }> }
) => Promise<Response>

beforeAll(async () => {
  const route = await import('../[key]/route')
  GET = route.GET
})

beforeEach(() => {
  mockFetchData.mockClear()
  mockHasClusterCountKey.mockClear()
  mockGetClusterCountQuery.mockClear()

  mockFetchData.mockResolvedValue({
    data: [{ count: 42 }],
    metadata: { queryId: 'q1', duration: 5, rows: 1, host: '0' },
  })
  mockHasClusterCountKey.mockReturnValue(true)
  mockGetClusterCountQuery.mockReturnValue({
    query:
      'SELECT COUNT() as count FROM clusterAllReplicas({cluster: String}, system.replicas) WHERE is_readonly = 1',
  })
})

// ── Helpers ────────────────────────────────────────────────────────────────────

function countUrl(key: string, extra = '') {
  return `http://localhost:3000/api/v1/cluster-counts/${key}?cluster=default&hostId=0${extra ? `&${extra}` : ''}`
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /api/v1/cluster-counts/[key]', () => {
  test('returns count for a valid key with cluster and hostId', async () => {
    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.count).toBe(42)
    expect(body.metadata.queryId).toBe(
      'cluster-count-readonly-tables-in-cluster'
    )
  })

  test('passes cluster as query_params to fetchData', async () => {
    await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/readonly-tables-in-cluster?cluster=my-cluster&hostId=0'
      ),
      { params: Promise.resolve({ key: 'readonly-tables-in-cluster' }) }
    )

    expect(mockFetchData).toHaveBeenCalledWith(
      expect.objectContaining({
        query_params: { cluster: 'my-cluster' },
      })
    )
  })

  test('returns 400 when cluster parameter is missing', async () => {
    const res = await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/readonly-tables-in-cluster?hostId=0'
      ),
      { params: Promise.resolve({ key: 'readonly-tables-in-cluster' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('cluster')
  })

  test('returns 400 when cluster parameter is empty string', async () => {
    const res = await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/readonly-tables-in-cluster?cluster=&hostId=0'
      ),
      { params: Promise.resolve({ key: 'readonly-tables-in-cluster' }) }
    )

    expect(res.status).toBe(400)
  })

  test('returns 400 for invalid count key format', async () => {
    const res = await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/bad%20key?cluster=default&hostId=0'
      ),
      { params: Promise.resolve({ key: 'bad key' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Invalid count key format')
  })

  test('returns 404 when count key is not in registry', async () => {
    mockHasClusterCountKey.mockReturnValue(false)

    const res = await GET(new Request(countUrl('nonexistent-key')), {
      params: Promise.resolve({ key: 'nonexistent-key' }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('not found')
  })

  test('returns 404 when getClusterCountQuery returns null', async () => {
    mockGetClusterCountQuery.mockReturnValue(null)

    const res = await GET(new Request(countUrl('some-key')), {
      params: Promise.resolve({ key: 'some-key' }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.message).toContain('not found in registry')
  })

  test('returns 400 when hostId is invalid', async () => {
    const res = await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/readonly-tables-in-cluster?cluster=default&hostId=abc'
      ),
      { params: Promise.resolve({ key: 'readonly-tables-in-cluster' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.message).toContain('hostId')
  })

  test('defaults hostId to 0 when not provided', async () => {
    const res = await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/readonly-tables-in-cluster?cluster=default'
      ),
      { params: Promise.resolve({ key: 'readonly-tables-in-cluster' }) }
    )

    expect(res.status).toBe(200)
    expect(mockFetchData).toHaveBeenCalledWith(
      expect.objectContaining({ hostId: 0 })
    )
  })

  test('returns null count for optional table when query fails', async () => {
    mockGetClusterCountQuery.mockReturnValue({
      query: 'SELECT COUNT() FROM system.backup_log',
      optional: true,
    })
    mockFetchData.mockResolvedValue({
      error: { type: 'query_error', message: 'Table not found' },
    })

    const res = await GET(new Request(countUrl('optional-key')), {
      params: Promise.resolve({ key: 'optional-key' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.count).toBeNull()
  })

  test('returns 500 when non-optional query fails', async () => {
    mockFetchData.mockResolvedValue({
      error: { type: 'query_error', message: 'Connection refused' },
    })

    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Connection refused')
  })

  test('returns null count when data array is empty', async () => {
    mockFetchData.mockResolvedValue({
      data: [],
      metadata: { queryId: 'q1', duration: 1, rows: 0, host: '0' },
    })

    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.count).toBeNull()
  })

  test('converts string count to number', async () => {
    mockFetchData.mockResolvedValue({
      data: [{ count: '100' }],
      metadata: { queryId: 'q1', duration: 1, rows: 1, host: '0' },
    })

    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })
    const body = await res.json()

    expect(body.data.count).toBe(100)
  })

  test('handles unexpected exceptions with 500', async () => {
    mockFetchData.mockRejectedValue(new Error('Unexpected crash'))

    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Unexpected crash')
  })

  test('includes X-Request-ID header in response', async () => {
    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })

    expect(res.headers.get('X-Request-ID')).toBeTruthy()
  })

  test('sets SHORT Cache-Control header', async () => {
    const res = await GET(new Request(countUrl('readonly-tables-in-cluster')), {
      params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
    })

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=30')
  })
})
