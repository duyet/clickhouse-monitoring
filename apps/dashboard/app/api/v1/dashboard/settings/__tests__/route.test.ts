import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { mockAuthorizeFeatureRequest } from '@/app/api/v1/__tests__/feature-permissions-mock'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockQuery = mock(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        { key: 'theme', value: 'dark' },
        { key: 'refreshInterval', value: '30' },
      ]),
  })
)

const mockCommand = mock(() => Promise.resolve({}))
const mockGetClient = mock(() =>
  Promise.resolve({
    query: mockQuery,
    command: mockCommand,
  })
)

mock.module('@chm/clickhouse-client', () => ({
  getClient: mockGetClient,
  fetchData: mock(() => Promise.resolve({ data: [], metadata: {} })),
  fetchJsonEachRowAsNormalizedJson: mock(() =>
    Promise.resolve({ dataJson: '[]', metadata: {} })
  ),
}))

// ── Import route after mocks ───────────────────────────────────────────────────

let GET: (request: Request) => Promise<Response>
let POST: (request: Request) => Promise<Response>

beforeAll(async () => {
  const route = await import('../route')
  GET = route.GET
  POST = route.POST
})

beforeEach(() => {
  mockGetClient.mockClear()
  mockQuery.mockClear()
  mockCommand.mockClear()
  mockAuthorizeFeatureRequest.mockClear()

  // Bypass feature permission checks in route tests
  mockAuthorizeFeatureRequest.mockResolvedValue(null)

  mockGetClient.mockResolvedValue({
    query: mockQuery,
    command: mockCommand,
  })
  mockQuery.mockResolvedValue({
    json: () =>
      Promise.resolve([
        { key: 'theme', value: 'dark' },
        { key: 'refreshInterval', value: '30' },
      ]),
  })
  mockCommand.mockResolvedValue({})
})

// ── GET tests ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/dashboard/settings', () => {
  test('returns settings as key-value params', async () => {
    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.params.theme).toBe('dark')
    expect(body.data.params.refreshInterval).toBe('30')
    expect(body.metadata.rows).toBe(2)
  })

  test('defaults hostId to 0 when not provided', async () => {
    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings')
    )

    expect(res.status).toBe(200)
    expect(mockGetClient).toHaveBeenCalledWith({ hostId: 0 })
  })

  test('uses provided hostId', async () => {
    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=2')
    )

    expect(res.status).toBe(200)
    expect(mockGetClient).toHaveBeenCalledWith({ hostId: 2 })
  })

  test('returns 400 for invalid hostId', async () => {
    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=-1')
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  test('returns 400 for non-integer hostId', async () => {
    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=1.5')
    )

    expect(res.status).toBe(400)
  })

  test('returns empty params when settings table has no rows', async () => {
    mockQuery.mockResolvedValue({
      json: () => Promise.resolve([]),
    })

    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.params).toEqual({})
    expect(body.metadata.rows).toBe(0)
  })

  test('returns empty response when table is missing (UNKNOWN_TABLE)', async () => {
    mockQuery.mockRejectedValue(new Error('UNKNOWN_TABLE: ch_monitor.settings'))

    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.params).toEqual({})
  })

  test('returns empty response when table is missing (Unknown table expression)', async () => {
    mockQuery.mockRejectedValue(
      new Error('Unknown table expression: ch_monitor.settings')
    )

    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.params).toEqual({})
  })

  test("returns empty response when table is missing (doesn't exist)", async () => {
    mockQuery.mockRejectedValue(
      new Error("Table ch_monitor.settings doesn't exist")
    )

    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.params).toEqual({})
  })

  test('returns 500 for other query errors', async () => {
    mockQuery.mockRejectedValue(new Error('Connection refused'))

    const res = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Connection refused')
  })
})

// ── POST tests ─────────────────────────────────────────────────────────────────

describe('POST /api/v1/dashboard/settings', () => {
  test('updates settings with valid params', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' }, hostId: 0 }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.success).toBe(true)
    expect(mockCommand).toHaveBeenCalled()
  })

  test('passes hostId to getClient', async () => {
    await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' }, hostId: 3 }),
      })
    )

    expect(mockGetClient).toHaveBeenCalledWith({ hostId: 3 })
  })

  test('defaults hostId to 0 when not in body', async () => {
    await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' } }),
      })
    )

    expect(mockGetClient).toHaveBeenCalledWith({ hostId: 0 })
  })

  test('returns 400 when params is missing', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('params')
  })

  test('returns 400 when params is an array', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: [1, 2, 3] }),
      })
    )

    expect(res.status).toBe(400)
  })

  test('returns 400 when params is not an object', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: 'string-value' }),
      })
    )

    expect(res.status).toBe(400)
  })

  test('returns 400 for invalid hostId', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' }, hostId: -1 }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('hostId')
  })

  test('returns 400 for non-integer hostId', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' }, hostId: 3.14 }),
      })
    )

    expect(res.status).toBe(400)
  })

  test('returns 500 when command throws', async () => {
    mockCommand.mockRejectedValue(new Error('Write failed'))

    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' }, hostId: 0 }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('Write failed')
  })

  test('handles string hostId in body', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'light' }, hostId: '2' }),
      })
    )

    expect(res.status).toBe(200)
    expect(mockGetClient).toHaveBeenCalledWith({ hostId: 2 })
  })
})
