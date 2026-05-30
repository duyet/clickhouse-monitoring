import { describe, expect, mock, test } from 'bun:test'
import { z } from 'zod/v3'

mock.module('server-only', () => ({}))

let queryIndex = 0
const resetQueryIndex = () => {
  queryIndex = 0
}

const readOnlyQuery = mock(async ({ query }: { query: string }) => {
  const q = query
  queryIndex++

  if (q.includes('system.tables') && q.includes('WHERE database')) {
    return [
      {
        engine: 'MergeTree',
        sorting_key: '(event_date, tenant_id)',
        primary_key: 'event_date',
        partition_key: 'toYYYYMM(event_date)',
        total_rows: 5000000,
        total_bytes: 1073741824,
        readable_size: '1.00 GiB',
        create_table_query: 'CREATE TABLE analytics.events ...',
      },
    ]
  }

  if (q.includes('system.parts') && q.includes('active')) {
    return [
      {
        active_parts: 150,
        total_size: '1.50 GiB',
        oldest_part: '2026-05-01 00:00:00',
        newest_part: '2026-05-30 12:00:00',
      },
    ]
  }

  if (q.includes('system.mutations')) {
    return [
      {
        mutation_id: 'mutation_1.txt',
        command: 'UPDATE status = 1 WHERE status = 0',
        create_time: '2026-05-29 10:00:00',
        parts_to_do: 0,
        is_done: 1,
      },
    ]
  }

  if (q.includes('system.replicas')) {
    return [
      {
        is_leader: 1,
        is_readonly: 0,
        absolute_delay: 0,
        queue_size: 2,
        inserts_in_queue: 1,
        merges_in_queue: 1,
      },
    ]
  }

  if (q.includes('system.columns') && q.includes('ORDER BY position')) {
    return [
      {
        name: 'event_date',
        type: 'Date',
        default_kind: '',
        default_expression: '',
      },
      {
        name: 'tenant_id',
        type: 'UInt64',
        default_kind: '',
        default_expression: '',
      },
      {
        name: 'status',
        type: 'String',
        default_kind: '',
        default_expression: '',
      },
    ]
  }

  // get_column_usage: usage summary query
  if (
    q.includes('count() as query_count') &&
    q.includes('countDistinct(user)')
  ) {
    return [
      {
        query_count: 42,
        unique_users: 3,
        first_seen: '2026-05-23 08:00:00',
        last_seen: '2026-05-30 11:00:00',
      },
    ]
  }

  // get_column_usage: users affected query
  if (q.includes('GROUP BY user') && q.includes('any(substring')) {
    return [
      {
        user: 'analyst',
        query_count: 30,
        sample_query: 'SELECT status FROM analytics.events WHERE tenant_id = 1',
      },
    ]
  }

  return []
})

mock.module('../helpers', () => ({
  hostIdSchema: z.number().int().min(0).optional(),
  resolveHostId: (a: number | undefined, b: number) => a ?? b,
  readOnlyQuery,
}))

const { createMigrationTools } = await import('../migration-tools')

describe('createMigrationTools', () => {
  test('creates both migration tools', () => {
    const tools = createMigrationTools(0)
    expect(tools.analyze_schema_change).toBeDefined()
    expect(tools.get_column_usage).toBeDefined()
  })

  describe('analyze_schema_change', () => {
    test('classifies ADD COLUMN as low risk with no rewrite', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events ADD COLUMN new_col String',
      })

      expect(result.table).toBe('analytics.events')
      expect(result.proposed_change).toBe(
        'ALTER TABLE events ADD COLUMN new_col String'
      )
      expect(result.change_classification.type).toBe('add_column')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
      expect(result.change_classification.risk_level).toBe('LOW')
      expect(result.warnings).toHaveLength(0)
      expect(result.current_state.table_info).toBeDefined()
      expect(result.current_state.parts).toBeDefined()
      expect(result.current_state.pending_mutations).toBeDefined()
      expect(result.current_state.replication).toBeDefined()
      expect(result.current_state.columns).toBeDefined()
    })

    test('classifies MODIFY COLUMN as high risk requiring rewrite', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events MODIFY COLUMN status UInt32',
      })

      expect(result.change_classification.type).toBe('modify_column')
      expect(result.change_classification.requires_data_rewrite).toBe(true)
      expect(result.change_classification.risk_level).toBe('HIGH')
      expect(result.warnings).toContain(
        'This change requires rewriting all data parts. Schedule during low-traffic periods.'
      )
    })

    test('classifies DROP COLUMN as low risk', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events DROP COLUMN old_col',
      })

      expect(result.change_classification.type).toBe('drop_column')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
      expect(result.change_classification.risk_level).toBe('LOW')
    })

    test('classifies RENAME COLUMN as low risk', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events RENAME COLUMN old_name TO new_name',
      })

      expect(result.change_classification.type).toBe('rename_column')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
    })

    test('classifies ALTER COLUMN as modify requiring rewrite', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events ALTER COLUMN status SET DEFAULT 0',
      })

      expect(result.change_classification.type).toBe('modify_column')
      expect(result.change_classification.requires_data_rewrite).toBe(true)
    })

    test('classifies ADD INDEX as requiring rewrite', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement:
          'ALTER TABLE events ADD INDEX idx_status status TYPE bloom_filter GRANULARITY 1',
      })

      expect(result.change_classification.type).toBe('index_change')
      expect(result.change_classification.requires_data_rewrite).toBe(true)
    })

    test('classifies DROP INDEX as low risk', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events DROP INDEX idx_status',
      })

      expect(result.change_classification.type).toBe('index_change')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
    })

    test('classifies MODIFY ORDER BY as sorting key change', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement:
          'ALTER TABLE events MODIFY ORDER BY (event_date, tenant_id, status)',
      })

      expect(result.change_classification.type).toBe('sorting_key_change')
      expect(result.change_classification.requires_data_rewrite).toBe(true)
    })

    test('classifies MODIFY SORTING KEY as sorting key change', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events MODIFY SORTING KEY (event_date)',
      })

      expect(result.change_classification.type).toBe('sorting_key_change')
      expect(result.change_classification.requires_data_rewrite).toBe(true)
    })

    test('classifies DROP PROJECTION as low risk', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events DROP PROJECTION my_proj',
      })

      expect(result.change_classification.type).toBe('projection_change')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
    })

    test('classifies ADD PROJECTION as requiring rewrite', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement:
          'ALTER TABLE events ADD PROJECTION my_proj (SELECT ...)',
      })

      expect(result.change_classification.type).toBe('projection_change')
      expect(result.change_classification.requires_data_rewrite).toBe(true)
    })

    test('classifies MODIFY TTL as low risk', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement:
          'ALTER TABLE events MODIFY TTL event_date + INTERVAL 30 DAY',
      })

      expect(result.change_classification.type).toBe('ttl_change')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
    })

    test('classifies unknown statements as unknown type', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events FREEZE',
      })

      expect(result.change_classification.type).toBe('unknown')
      expect(result.change_classification.requires_data_rewrite).toBe(false)
    })

    test('warns about pending mutations', async () => {
      const origImpl = readOnlyQuery.getMockImplementation()
      readOnlyQuery.mockImplementation(async ({ query }: { query: string }) => {
        if (query.includes('system.mutations')) {
          return [
            {
              mutation_id: 'mutation_2.txt',
              command: 'UPDATE x = 1',
              create_time: '2026-05-30 10:00:00',
              parts_to_do: 5,
              is_done: 0,
            },
          ]
        }
        return origImpl!({ query })
      })

      const tools = createMigrationTools(0)
      const result = await tools.analyze_schema_change.execute({
        database: 'analytics',
        table: 'events',
        alterStatement: 'ALTER TABLE events ADD COLUMN new_col String',
      })

      readOnlyQuery.mockImplementation(origImpl!)

      expect(result.warnings).toContain(
        'There are pending mutations on this table. Wait for them to complete before adding more.'
      )
    })
  })

  describe('get_column_usage', () => {
    test('returns usage summary and affected users', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.get_column_usage.execute({
        database: 'analytics',
        table: 'events',
        column: 'status',
        lastDays: 7,
      })

      expect(result.column).toBe('analytics.events.status')
      expect(result.time_window_days).toBe(7)
      expect(result.usage_summary).toBeDefined()
      expect(result.users_affected).toBeDefined()
      expect(result.recommendation).toContain('Review the users')
    })

    test('clamps lastDays to max 30', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.get_column_usage.execute({
        database: 'analytics',
        table: 'events',
        column: 'status',
        lastDays: 100,
      })

      expect(result.time_window_days).toBe(30)
    })

    test('clamps lastDays to min 1', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.get_column_usage.execute({
        database: 'analytics',
        table: 'events',
        column: 'status',
        lastDays: -5,
      })

      expect(result.time_window_days).toBe(1)
    })

    test('uses default lastDays of 7 when not provided', async () => {
      resetQueryIndex()
      const tools = createMigrationTools(0)

      const result = await tools.get_column_usage.execute({
        database: 'analytics',
        table: 'events',
        column: 'status',
      })

      expect(result.time_window_days).toBe(7)
    })
  })
})
