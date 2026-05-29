import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

mock.module('@/lib/clickhouse', () => ({
  fetchData: async ({
    query,
  }: {
    query: string
    query_params?: Record<string, unknown>
  }) => {
    if (query.includes('EXPLAIN')) {
      return { data: [{ explain: 'Plan looks valid' }], error: null }
    }

    if (query.includes('system.tables')) {
      return {
        data: [
          {
            engine: 'MergeTree',
            sorting_key: 'tuple()',
            primary_key: '',
            partition_key: '',
            total_rows: 1000000,
            total_bytes: 100000000,
            create_table_query: 'CREATE TABLE analytics.events ...',
          },
        ],
        error: null,
      }
    }

    if (query.includes('system.columns')) {
      return {
        data: [
          { name: 'tenant_id', type: 'UInt64' },
          { name: 'event_date', type: 'Date' },
          { name: 'status', type: 'String' },
          { name: 'nullable_value', type: 'Nullable(String)' },
          { name: 'status_code', type: 'Int64' },
        ],
        error: null,
      }
    }

    if (
      query.includes('system.query_log') &&
      query.includes('ExceptionWhileProcessing')
    ) {
      return {
        data: [
          {
            exception_code: 47,
            count: 12,
            sample_error: 'Missing column status',
            sample_query: 'SELECT status FROM analytics.events',
          },
        ],
        error: null,
      }
    }

    if (
      query.includes('system.query_log') &&
      query.includes('GROUP BY normalized_query_hash')
    ) {
      return {
        data: [
          {
            normalized_query_hash: '123',
            sample_query:
              'SELECT status, count() FROM analytics.events WHERE tenant_id = 1 GROUP BY status',
            count: 8,
            avg_duration_ms: 7000,
            max_duration_ms: 15000,
            avg_read_rows: 10000000,
            avg_result_rows: 10,
            total_read_bytes: 1000000000,
          },
        ],
        error: null,
      }
    }

    if (query.includes('system.parts') && query.includes('HAVING parts >=')) {
      return {
        data: [
          {
            database: 'analytics',
            table: 'events',
            parts: 400,
            size: '10 GiB',
          },
        ],
        error: null,
      }
    }

    if (query.includes('system.parts') && query.includes('compression_ratio')) {
      return {
        data: [
          {
            database: 'analytics',
            table: 'events',
            compression_ratio: 0.8,
            uncompressed: '50 GiB',
          },
        ],
        error: null,
      }
    }

    if (query.includes('system.parts')) {
      return {
        data: [{ parts: 400, size: '10 GiB', compression_ratio: 0.8 }],
        error: null,
      }
    }

    if (query.includes('system.mutations')) {
      return {
        data: [
          {
            database: 'analytics',
            table: 'events',
            mutation_id: '0001',
            command: 'UPDATE x',
            parts_to_do: 5,
          },
        ],
        error: null,
      }
    }

    if (query.includes('system.replicas')) {
      return {
        data: [
          {
            database: 'analytics',
            table: 'events',
            absolute_delay: 120,
            queue_size: 5,
            is_readonly: 0,
          },
        ],
        error: null,
      }
    }

    return { data: [], error: null }
  },
}))

const { createDiagnosticsTools } = await import('../tools/diagnostics-tools')

describe('createDiagnosticsTools', () => {
  test('creates diagnostics tools', () => {
    const tools = createDiagnosticsTools(0)

    expect(tools.spot_issues).toBeDefined()
    expect(tools.repair_query).toBeDefined()
    expect(tools.recommend_table_design).toBeDefined()
  })

  test('spot_issues returns ranked issue output', async () => {
    const tools = createDiagnosticsTools(0)

    const result = await tools.spot_issues.execute({ lastHours: 24 })

    expect(result.type).toBe('agent_issues')
    expect(result.issueCount).toBeGreaterThan(0)
    expect(result.issues[0].severity).toBeDefined()
  })

  test('repair_query blocks unsafe SQL', async () => {
    const tools = createDiagnosticsTools(0)

    const result = await tools.repair_query.execute({
      sql: 'DROP TABLE analytics.events',
    })

    expect(result.type).toBe('query_repair')
    expect(result.status).toBe('blocked')
    expect(result.fixedSql).toBeNull()
  })

  test('repair_query applies deterministic fixes', async () => {
    const tools = createDiagnosticsTools(0)

    const result = await tools.repair_query.execute({
      sql: 'SELECT count(*) FROM analytics.events',
    })

    expect(result.type).toBe('query_repair')
    expect(result.status).toBe('repaired')
    expect(result.fixedSql).toContain('count()')
  })

  test('recommend_table_design returns evidence-backed recommendations', async () => {
    const tools = createDiagnosticsTools(0)

    const result = await tools.recommend_table_design.execute({
      database: 'analytics',
      table: 'events',
      lastDays: 7,
    })

    expect(result.type).toBe('table_design_recommendation')
    expect(result.table).toBe('analytics.events')
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.suggestedOrderBy).toContain('tenant_id')
  })
})
