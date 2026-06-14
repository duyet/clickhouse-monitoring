import { beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock 'cloudflare:workers' because it is imported in index.ts
mock.module('cloudflare:workers', () => ({
  env: {
    CLICKHOUSE_HOST: 'http://localhost:8123',
    CLICKHOUSE_USER: 'default',
    CLICKHOUSE_PASSWORD: '',
  },
}))

const mockFetchData = mock(
  async (_args: {
    query: string
  }): Promise<{
    data: unknown[] | null
    error: unknown
  }> => ({ data: [], error: null })
)

mock.module('@chm/clickhouse-client', () => ({
  fetchData: mockFetchData,
}))

describe('menu-counts API GET handler', () => {
  beforeEach(() => {
    mockFetchData.mockClear()
  })

  test('constructs combined query and executes it', async () => {
    const { handler } = await import('../index')

    // Mock system.tables check to return existing tables
    // Mock the combined query to return some counts
    mockFetchData.mockImplementation(async ({ query }) => {
      if (query.includes('database, name')) {
        return {
          data: [
            { database: 'system', name: 'clusters' },
            { database: 'system', name: 'backup_log' },
          ],
          error: null,
        }
      }
      if (query.includes('AS')) {
        return {
          data: [
            {
              'tables-explorer': 5,
              'tables-overview': 10,
              clusters: 2,
              backups: 1,
            },
          ],
          error: null,
        }
      }
      return { data: [], error: null }
    })

    const request = new Request('http://localhost/api/v1/menu-counts?hostId=0')
    const response = await handler(request)
    expect(response.status).toBe(200)

    const body = (await response.json()) as {
      data: { counts: Record<string, number | null> }
    }
    expect(body.data).toHaveProperty('counts')
    expect(body.data.counts['tables-explorer']).toBe(5)
    expect(body.data.counts['tables-overview']).toBe(10)
    expect(body.data.counts['clusters']).toBe(2)
    expect(body.data.counts['backups']).toBe(1)
    // Optional table that doesn't exist should be null
    expect(body.data.counts['distributed-ddl-queue']).toBeNull()

    // Assert that exactly 2 queries were executed: system.tables check and the combined query
    expect(mockFetchData.mock.calls.length).toBe(2)
    expect(mockFetchData.mock.calls[0]?.[0]?.query).toContain('database, name')
    expect(mockFetchData.mock.calls[1]?.[0]?.query).toContain('AS')
  })

  test('falls back to sequential loop when combined query fails', async () => {
    const { handler } = await import('../index')

    mockFetchData.mockImplementation(async ({ query }) => {
      if (query.includes('database, name')) {
        return {
          data: [{ database: 'system', name: 'clusters' }],
          error: null,
        }
      }
      if (query.includes('AS')) {
        // Combined query fails
        return {
          data: null,
          error: { message: 'Syntax error or something' },
        }
      }
      // Single queries from resolveCount
      return {
        data: [{ count: 42 }],
        error: null,
      }
    })

    const request = new Request('http://localhost/api/v1/menu-counts?hostId=0')
    const response = await handler(request)
    expect(response.status).toBe(200)

    const body = (await response.json()) as {
      data: { counts: Record<string, number | null> }
    }
    expect(body.data.counts['tables-explorer']).toBe(42)

    // Verify it executed more queries because of fallback loop
    expect(mockFetchData.mock.calls.length).toBeGreaterThan(2)
  })
})
