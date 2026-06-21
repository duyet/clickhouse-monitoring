import { validateDeclarativeConfig } from './validate'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// Valid — minimal config
// ---------------------------------------------------------------------------

describe('minimal valid config', () => {
  test('accepts name + sql string + columns', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.name).toBe('my-query')
    expect(result.config.sql).toBe('SELECT 1')
    expect(result.config.optional).toBe(false) // default
  })
})

// ---------------------------------------------------------------------------
// Valid — full-featured config (VersionedSql + BackgroundBar + optional)
// ---------------------------------------------------------------------------

describe('full-featured valid config', () => {
  test('accepts versioned sql array', () => {
    const result = validateDeclarativeConfig({
      name: 'slow-queries',
      description: 'Top 10 slowest queries',
      docs: 'https://clickhouse.com/docs',
      sql: [
        { since: '23.8', sql: 'SELECT query_id FROM system.query_log' },
        {
          since: '24.1',
          sql: 'SELECT query_id, query_cache_usage FROM system.query_log',
          description: 'Added query_cache_usage',
        },
      ],
      columns: ['query_id', 'readable_read_rows', 'readable_read_bytes'],
      columnFormats: {
        readable_read_rows: 'background-bar',
        readable_read_bytes: ['background-bar', { numberFormat: true }],
        query_id: ['link', { href: '/query?query_id=[query_id]' }],
      },
      optional: true,
      tableCheck: 'system.query_log',
      defaultParams: { min_duration_s: '5', last_hours: 24 },
      filterParamPresets: [
        { name: 'Last hour', key: 'last_hours', value: '1' },
        { name: '> 5s', key: 'min_duration_s', value: '5' },
      ],
      relatedCharts: [
        'slow-query-occurrences',
        ['query-duration-histogram', { bucket: 60 }],
      ],
      card: {
        primary: 'query',
        badges: ['query_cache_usage'],
        metrics: ['user', 'query_duration'],
        hidden: ['readable_read_rows'],
      },
      defaultView: 'auto',
      sortingFns: { readable_read_rows: 'sort_column_using_pct' },
      refreshInterval: 30000,
      tableBehavior: {
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      console.error(result.errors)
      return
    }
    expect(result.config.name).toBe('slow-queries')
    expect(Array.isArray(result.config.sql)).toBe(true)
    expect(result.config.optional).toBe(true)
    expect(result.config.tableCheck).toBe('system.query_log')
    expect(result.config.defaultView).toBe('auto')
    expect(result.config.sortingFns?.readable_read_rows).toBe(
      'sort_column_using_pct'
    )
  })

  test('accepts action column format with array args', () => {
    const result = validateDeclarativeConfig({
      name: 'running-queries',
      sql: 'SELECT query_id FROM system.processes',
      columns: ['action', 'query_id'],
      columnFormats: {
        action: ['action', ['kill-query', 'explain-query']],
      },
    })

    expect(result.ok).toBe(true)
  })

  test('accepts typed link and code-dialog column format args', () => {
    const result = validateDeclarativeConfig({
      name: 'query-detail',
      sql: 'SELECT query_id, query FROM system.query_log',
      columns: ['query_id', 'query'],
      columnFormats: {
        query_id: [
          'link',
          {
            href: '/query?query_id=[query_id]',
            title: 'Open query',
            'data-testid': 'query-link',
          },
        ],
        query: [
          'code-dialog',
          {
            dialog_title: 'Query',
            max_truncate: 200,
            hide_query_comment: true,
            show_query_plan: false,
          },
        ],
      },
    })

    expect(result.ok).toBe(true)
  })

  test('accepts array args for action and inline-action column formats', () => {
    const result = validateDeclarativeConfig({
      name: 'query-detail',
      sql: 'SELECT query_id FROM system.query_log',
      columns: ['query_id'],
      columnFormats: {
        query_id: ['action', [{ type: 'kill-query' }]],
      },
    })

    expect(result.ok).toBe(true)
  })

  test('accepts tableCheck as string array', () => {
    const result = validateDeclarativeConfig({
      name: 'backup-log',
      sql: 'SELECT * FROM system.backup_log',
      columns: ['name', 'status'],
      optional: true,
      tableCheck: ['system.backup_log', 'system.error_log'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.tableCheck).toEqual([
      'system.backup_log',
      'system.error_log',
    ])
  })

  test('accepts bulkActions and bulkActionKey', () => {
    const result = validateDeclarativeConfig({
      name: 'queries',
      sql: 'SELECT query_id FROM system.processes',
      columns: ['query_id', 'user'],
      bulkActions: ['kill-query'],
      bulkActionKey: 'query_id',
    })

    expect(result.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Invalid cases
// ---------------------------------------------------------------------------

describe('invalid configs', () => {
  test('rejects missing name', () => {
    const result = validateDeclarativeConfig({
      sql: 'SELECT 1',
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })

  test('rejects empty name', () => {
    const result = validateDeclarativeConfig({
      name: '',
      sql: 'SELECT 1',
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })

  test('rejects missing sql', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('sql'))).toBe(true)
  })

  test('rejects empty sql string', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: '',
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('sql'))).toBe(true)
  })

  test('rejects empty versioned sql array', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: [],
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('sql'))).toBe(true)
  })

  test('rejects bad since version in versioned sql', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: [{ since: 'not-a-version', sql: 'SELECT 1' }],
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('version'))).toBe(true)
  })

  test('rejects missing sql in versioned entry', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: [{ since: '23.8' }],
      columns: ['col1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('rejects empty columns array', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: [],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('columns'))).toBe(true)
  })

  test('rejects invalid defaultView value', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      defaultView: 'invalid-view',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('defaultView'))).toBe(true)
  })

  test('accepts non-URL docs field (table-missing help text)', () => {
    // docs mirrors QueryConfig.docs (plain string) — a full sentence with an
    // embedded URL is valid, not just a bare URL.
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      docs: "The 'query_log' table may be missing. See https://clickhouse.com/docs/en/operations/system-tables/query_log",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.docs).toContain('query_log')
  })

  test('accepts clickhouseSettings with primitive values', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      clickhouseSettings: {
        allow_introspection_functions: 1,
        allow_experimental_analyzer: 0,
        log_comment: 'chmonitor',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.clickhouseSettings).toEqual({
      allow_introspection_functions: 1,
      allow_experimental_analyzer: 0,
      log_comment: 'chmonitor',
    })
  })

  test('rejects clickhouseSettings with non-primitive values', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      clickhouseSettings: { nested: { not: 'allowed' } },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('clickhouseSettings'))).toBe(
      true
    )
  })

  test('accepts rowStyle with rules and nested all/any conditions', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      rowStyle: {
        rules: [
          {
            when: { column: 'd', op: 'gt', value: 60 },
            className: 'bg-red-50',
          },
          {
            when: {
              all: [
                { column: 'is_done', op: 'falsy' },
                { column: 'elapsed', op: 'gt', value: 600 },
              ],
            },
            className: 'bg-amber-50',
          },
        ],
        default: '',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.rowStyle?.rules.length).toBe(2)
  })

  test('rejects rowStyle with empty rules array', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      rowStyle: { rules: [] },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('rowStyle'))).toBe(true)
  })

  test('rejects rowStyle comparison op without a numeric value', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      rowStyle: {
        rules: [{ when: { column: 'd', op: 'gt' }, className: 'bg-red-50' }],
      },
    })

    expect(result.ok).toBe(false)
  })

  test('accepts permission with a valid feature id', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      permission: { feature: 'queries' },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.config.permission).toEqual({ feature: 'queries' })
  })

  test('accepts permission with optional access/operation', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      permission: {
        feature: 'metrics',
        defaultAccess: 'authenticated',
        operation: 'read',
      },
    })

    expect(result.ok).toBe(true)
  })

  test('rejects permission with an unknown feature id', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      permission: { feature: 'not-a-feature' },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.includes('permission'))).toBe(true)
  })

  test('rejects unknown columnFormat enum value', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT 1',
      columns: ['col1'],
      columnFormats: { col1: 'not-a-format' },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('rejects malformed link and code-dialog column format args', () => {
    const linkResult = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT query_id FROM system.query_log',
      columns: ['query_id'],
      columnFormats: {
        query_id: ['link', { href: 42 }],
      },
    })

    expect(linkResult.ok).toBe(false)

    const codeDialogResult = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT query FROM system.query_log',
      columns: ['query'],
      columnFormats: {
        query: ['code-dialog', { max_truncate: '200' }],
      },
    })

    expect(codeDialogResult.ok).toBe(false)
  })

  test('rejects array args for typed object column formats', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT query_id FROM system.query_log',
      columns: ['query_id'],
      columnFormats: {
        query_id: ['link', ['not-an-object']],
      },
    })

    expect(result.ok).toBe(false)
  })

  test('rejects array args for non-array column formats', () => {
    const result = validateDeclarativeConfig({
      name: 'my-query',
      sql: 'SELECT query_id FROM system.query_log',
      columns: ['query_id'],
      columnFormats: {
        query_id: ['badge', ['some', 'array']],
      },
    })

    expect(result.ok).toBe(false)
  })

  test('rejects non-object input', () => {
    const result = validateDeclarativeConfig('not an object')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
