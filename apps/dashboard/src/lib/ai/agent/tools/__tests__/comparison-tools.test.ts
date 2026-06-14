import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryResults: Record<string, unknown[]> = {
  queries: [
    {
      total: 1500,
      avg_duration_ms: 320,
      p95_duration_ms: 2500,
      total_read: '10.50 GiB',
    },
  ],
  errors: [
    {
      total_errors: 12,
      unique_errors: 3,
      sample_error: 'Missing column: xyz',
    },
  ],
  storage: [
    {
      total_size: '500.00 GiB',
      total_parts: 12000,
      total_tables: 45,
    },
  ],
  merges: [{ total_merges: 8 }],
  version: [{ version: '24.8.5', uptime_seconds: 864000 }],
  disks: [{ name: 'default', free: '100.00 GiB', total: '500.00 GiB' }],
  topTables: [
    {
      database: 'analytics',
      name: 'events',
      size: '200.00 GiB',
      total_rows: 500000000,
    },
  ],
  queryLoad: [{ query_count: 500, avg_duration_ms: 150 }],
}

function setupComparisonMocks() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    const q = query

    if (q.includes('version()'))
      return { data: queryResults.version, error: null }
    if (q.includes('system.disks') && q.includes('free_space'))
      return { data: queryResults.disks, error: null }
    if (q.includes('total_bytes') && q.includes('DESC LIMIT 5'))
      return { data: queryResults.topTables, error: null }
    if (q.includes('avg(query_duration_ms)') && q.includes('INTERVAL 1 HOUR'))
      return { data: queryResults.queryLoad, error: null }
    if (
      q.includes('QueryFinish') &&
      q.includes('is_initial_query') &&
      !q.includes('event_time')
    )
      return { data: queryResults.queries, error: null }
    if (q.includes('ExceptionWhileProcessing'))
      return { data: queryResults.errors, error: null }
    if (q.includes('system.parts') && q.includes('active'))
      return { data: queryResults.storage, error: null }
    if (q.includes('system.merges'))
      return { data: queryResults.merges, error: null }
    if (q.includes('event_time BETWEEN'))
      return { data: queryResults.queries, error: null }

    return { data: [], error: null }
  })
}

const { createComparisonTools } = await import('../comparison-tools')

describe('createComparisonTools', () => {
  test('creates both comparison tools', () => {
    const tools = createComparisonTools(0) as any
    expect(tools.compare_time_periods).toBeDefined()
    expect(tools.compare_hosts).toBeDefined()
  })

  describe('compare_time_periods', () => {
    test('compares queries between two periods', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_time_periods.execute({
        metric: 'queries',
        period1Hours: 48,
        period1Duration: 24,
        period2Hours: 0,
        period2Duration: 24,
      })

      expect(result.metric).toBe('queries')
      expect(result.period1).toBeDefined()
      expect(result.period2).toBeDefined()
      expect(result.period1.label).toContain('48h ago')
      expect(result.period1.label).toContain('24h window')
      expect(result.period2.data).toBeDefined()
    })

    test('returns snapshot note for storage metric', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_time_periods.execute({
        metric: 'storage',
        period1Hours: 48,
        period1Duration: 24,
        period2Hours: 0,
        period2Duration: 24,
      })

      expect(result.metric).toBe('storage')
      expect(result.note).toContain('point-in-time snapshot')
      expect(result.current).toBeDefined()
    })

    test('returns snapshot note for merges metric', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_time_periods.execute({
        metric: 'merges',
        period1Hours: 48,
        period1Duration: 24,
        period2Hours: 0,
        period2Duration: 24,
      })

      expect(result.metric).toBe('merges')
      expect(result.note).toContain('currently active merges')
      expect(result.current).toBeDefined()
    })

    test('compares errors between two periods', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_time_periods.execute({
        metric: 'errors',
        period1Hours: 24,
        period1Duration: 12,
        period2Hours: 0,
        period2Duration: 12,
      })

      expect(result.metric).toBe('errors')
      expect(result.period1.data).toBeDefined()
      expect(result.period2.data).toBeDefined()
    })

    test('period labels show correct hours-ago and duration', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_time_periods.execute({
        metric: 'queries',
        period1Hours: 72,
        period1Duration: 24,
        period2Hours: 0,
        period2Duration: 6,
      })

      expect(result.period1.label).toBe('96h ago to 72h ago (24h window)')
      expect(result.period2.label).toBe('6h ago to 0h ago (6h window)')
    })
  })

  describe('compare_hosts', () => {
    test('returns side-by-side host comparison', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_hosts.execute({
        hostId1: 0,
        hostId2: 1,
      })

      expect(result.host1).toBeDefined()
      expect(result.host2).toBeDefined()
      expect(result.host1.hostId).toBe(0)
      expect(result.host2.hostId).toBe(1)
      expect(result.host1.version).toBeDefined()
      expect(result.host1.disks).toBeDefined()
      expect(result.host1.topTables).toBeDefined()
      expect(result.host1.queryLoad).toBeDefined()
    })

    test('includes disk and table size data', async () => {
      setupComparisonMocks()

      const tools = createComparisonTools(0) as any

      const result = await tools.compare_hosts.execute({
        hostId1: 0,
        hostId2: 1,
      })

      expect(result.host1.disks).toHaveLength(1)
      expect(result.host1.topTables).toHaveLength(1)
    })
  })
})
