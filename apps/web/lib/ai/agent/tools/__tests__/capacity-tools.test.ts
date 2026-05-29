import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

mock.module('@/lib/utils', () => ({
  formatBytes: (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`
    return `${bytes} B`
  },
}))

const storageGrowth = Array.from({ length: 30 }, (_, i) => ({
  day: `2026-04-${String(30 - i).padStart(2, '0')}`,
  daily_bytes: 1073741824 + i * 10485760,
  readable_size: '1.00 GiB',
  parts_added: 10 + i,
}))

const disks = [
  {
    name: 'default',
    free_space: 107374182400,
    total_space: 536870912000,
    readable_free: '100.00 GiB',
    readable_total: '500.00 GiB',
    free_pct: 20.0,
  },
]

const queryTrend = [
  {
    day: '2026-05-30',
    queries: 5000,
    avg_duration_ms: 200,
    total_read_bytes: 107374182400,
  },
]

const tableSizes = [
  {
    database: 'analytics',
    table: 'events',
    current_size: '200.00 GiB',
    total_rows: 500000000,
  },
]

mock.module('@chm/clickhouse-client', () => ({
  fetchData: mock(async ({ query }: { query: string }) => {
    const q = query

    if (q.includes('modification_time') && q.includes('daily_bytes'))
      return { data: storageGrowth, error: null }
    if (q.includes('system.disks') && q.includes('free_space'))
      return { data: disks, error: null }
    if (q.includes('query_log') && q.includes('total_read_bytes'))
      return { data: queryTrend, error: null }
    if (q.includes('sum(bytes_on_disk)') && q.includes('database, table'))
      return { data: tableSizes, error: null }

    return { data: [], error: null }
  }),
}))

const { createCapacityTools } = await import('../capacity-tools')

describe('createCapacityTools', () => {
  test('creates forecast_capacity tool', () => {
    const tools = createCapacityTools(0)
    expect(tools.forecast_capacity).toBeDefined()
  })

  describe('forecast_capacity', () => {
    test('returns full forecast with projections', async () => {
      const tools = createCapacityTools(0)
      const result = await tools.forecast_capacity.execute({})

      expect(result.forecast_days).toBe(90)
      expect(result.storage_trend).toBeDefined()
      expect(result.current_disks).toBeDefined()
      expect(result.query_volume_trend).toBeDefined()
      expect(result.top_tables).toBeDefined()
      expect(result.projections).toBeDefined()
      expect(result.instructions).toContain('capacity planning')
    })

    test('computes disk projections from growth data', async () => {
      const tools = createCapacityTools(0)
      const result = await tools.forecast_capacity.execute({})

      expect(result.projections).not.toBeNull()
      expect(result.projections).toHaveLength(1)

      const proj = result.projections[0]
      expect(proj.disk).toBe('default')
      expect(proj.avg_daily_growth_bytes).toBeGreaterThan(0)
      expect(proj.avg_daily_growth_readable).toBeDefined()
      expect(proj.days_until_full).toBeGreaterThan(0)
      expect(proj.days_until_90_pct).toBeDefined()
      expect(proj.free_pct).toBe(20.0)
    })

    test('accepts custom forecastDays', async () => {
      const tools = createCapacityTools(0)
      const result = await tools.forecast_capacity.execute({
        forecastDays: 180,
      })

      expect(result.forecast_days).toBe(180)
    })

    test('returns null projections when insufficient growth data', async () => {
      const { fetchData } = await import('@chm/clickhouse-client')

      const origImpl = (
        fetchData as ReturnType<typeof mock>
      ).getMockImplementation()
      ;(fetchData as ReturnType<typeof mock>).mockImplementation(
        async ({ query }: { query: string }) => {
          if (query.includes('daily_bytes')) {
            return { data: storageGrowth.slice(0, 3), error: null }
          }
          return origImpl!({ query })
        }
      )

      const tools = createCapacityTools(0)
      const result = await tools.forecast_capacity.execute({})

      ;(fetchData as ReturnType<typeof mock>).mockImplementation(origImpl!)

      expect(result.projections).toBeNull()
    })

    test('returns null projections when disks data is not an array', async () => {
      const { fetchData } = await import('@chm/clickhouse-client')

      const origImpl = (
        fetchData as ReturnType<typeof mock>
      ).getMockImplementation()
      ;(fetchData as ReturnType<typeof mock>).mockImplementation(
        async ({ query }: { query: string }) => {
          if (query.includes('system.disks')) {
            return { data: { error: 'disk query failed' }, error: null }
          }
          return origImpl!({ query })
        }
      )

      const tools = createCapacityTools(0)
      const result = await tools.forecast_capacity.execute({})

      ;(fetchData as ReturnType<typeof mock>).mockImplementation(origImpl!)

      expect(result.projections).toBeNull()
    })

    test('sets days_until projections to null when growth is zero', async () => {
      const { fetchData } = await import('@chm/clickhouse-client')

      const zeroGrowth = Array.from({ length: 10 }, () => ({
        day: '2026-05-01',
        daily_bytes: 0,
        readable_size: '0 B',
        parts_added: 0,
      }))

      const origImpl = (
        fetchData as ReturnType<typeof mock>
      ).getMockImplementation()
      ;(fetchData as ReturnType<typeof mock>).mockImplementation(
        async ({ query }: { query: string }) => {
          if (query.includes('daily_bytes')) {
            return { data: zeroGrowth, error: null }
          }
          return origImpl!({ query })
        }
      )

      const tools = createCapacityTools(0)
      const result = await tools.forecast_capacity.execute({})

      ;(fetchData as ReturnType<typeof mock>).mockImplementation(origImpl!)

      expect(result.projections).not.toBeNull()
      expect(result.projections[0].days_until_full).toBeNull()
      expect(result.projections[0].days_until_90_pct).toBeNull()
    })
  })
})
