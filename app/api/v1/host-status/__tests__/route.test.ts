import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const mockFetchData = mock(() =>
  Promise.resolve({
    data: [{ version: '25.1.1.1', uptime: '1 day', hostname: 'ch-host-1' }],
    metadata: {},
  })
)

mock.module('@/lib/clickhouse', () => ({
  fetchData: mockFetchData,
}))

let GET: (request: Request) => Promise<Response>

beforeAll(async () => {
  const route = await import('../route')
  GET = route.GET
})

beforeEach(() => {
  mockFetchData.mockClear()
  mockFetchData.mockResolvedValue({
    data: [{ version: '25.1.1.1', uptime: '1 day', hostname: 'ch-host-1' }],
    metadata: {},
  } as never)
})

describe('GET /api/v1/host-status', () => {
  test('returns host status on a successful query', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/v1/host-status?hostId=0')
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.version).toBe('25.1.1.1')
    expect(body.data.hostname).toBe('ch-host-1')
  })

  test('returns an upstream error status when the query fails', async () => {
    mockFetchData.mockResolvedValue({
      error: { type: 'network_error', message: 'Connection refused' },
    } as never)

    const response = await GET(
      new Request('http://localhost:3000/api/v1/host-status?hostId=0')
    )
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Connection refused')
  })

  test('rejects a missing hostId with a validation error', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/v1/host-status')
    )

    expect(response.status).toBe(400)
    expect(mockFetchData).not.toHaveBeenCalled()
  })
})
