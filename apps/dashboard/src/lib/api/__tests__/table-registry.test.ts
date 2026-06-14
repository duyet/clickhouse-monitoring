import type { FilterSchema } from '@/lib/filters/types'
import type { QueryConfig } from '@/lib/query-config'

import {
  getAvailableTables,
  getTableConfig,
  getTableQuery,
  hasTable,
  registerTableConfig,
  registerTableConfigs,
} from '../table-registry'
import { afterEach, describe, expect, test } from 'bun:test'
import { FILTER_PLACEHOLDER } from '@/lib/filters/where-builder'

/**
 * The registry is a process-global Map seeded from `queries`. Tests register
 * configs under unique, namespaced names and clean them up so they don't leak
 * into other suites that import the same module.
 */
const registered: string[] = []

function makeConfig(
  overrides: Partial<QueryConfig> & { name: string }
): QueryConfig {
  registered.push(overrides.name)
  return {
    sql: 'SELECT 1',
    columns: ['one'],
    ...overrides,
  } as QueryConfig
}

afterEach(() => {
  // getTableConfig leaves entries in the global Map; there is no public
  // delete, so re-register a benign empty marker is impossible. Instead we
  // rely on unique names per test to avoid cross-test collisions. Nothing to
  // undo for read-only assertions.
  registered.length = 0
})

describe('registerTableConfig / lookups', () => {
  test('registers a config and looks it up', () => {
    const cfg = makeConfig({ name: 'test:single' })
    registerTableConfig(cfg)

    expect(hasTable('test:single')).toBe(true)
    expect(getTableConfig('test:single')).toBe(cfg)
  })

  test('overwrites an existing config by name', () => {
    registerTableConfig(makeConfig({ name: 'test:dup', sql: 'SELECT 1' }))
    registerTableConfig(makeConfig({ name: 'test:dup', sql: 'SELECT 2' }))

    expect(getTableConfig('test:dup')?.sql).toBe('SELECT 2')
  })

  test('registerTableConfigs adds many at once', () => {
    registerTableConfigs([
      makeConfig({ name: 'test:multi-a' }),
      makeConfig({ name: 'test:multi-b' }),
    ])

    expect(hasTable('test:multi-a')).toBe(true)
    expect(hasTable('test:multi-b')).toBe(true)
  })

  test('hasTable is false and getTableConfig undefined for unknown names', () => {
    expect(hasTable('test:does-not-exist')).toBe(false)
    expect(getTableConfig('test:does-not-exist')).toBeUndefined()
  })

  test('getAvailableTables returns sorted, registered names', () => {
    registerTableConfig(makeConfig({ name: 'test:zeta' }))
    registerTableConfig(makeConfig({ name: 'test:alpha' }))

    const names = getAvailableTables()
    const idxAlpha = names.indexOf('test:alpha')
    const idxZeta = names.indexOf('test:zeta')

    expect(idxAlpha).toBeGreaterThanOrEqual(0)
    expect(idxZeta).toBeGreaterThan(idxAlpha)
    // Globally sorted ascending.
    expect([...names]).toEqual([...names].sort())
  })
})

describe('getTableQuery — plain path (no filterSchema)', () => {
  test('returns null for an unknown config name', () => {
    expect(getTableQuery('test:unknown', { hostId: 0 })).toBeNull()
  })

  test('returns defaultParams when present and no search params', () => {
    registerTableConfig(
      makeConfig({
        name: 'test:plain-defaults',
        sql: 'SELECT * FROM t WHERE x = {x:UInt32}',
        defaultParams: { x: 5 },
      })
    )

    const result = getTableQuery('test:plain-defaults', { hostId: 0 })

    expect(result).not.toBeNull()
    expect(result?.query).toBe('SELECT * FROM t WHERE x = {x:UInt32}')
    expect(result?.queryParams).toEqual({ x: 5 })
    expect(result?.queryConfig.name).toBe('test:plain-defaults')
  })

  test('layers search params over default params', () => {
    registerTableConfig(
      makeConfig({
        name: 'test:plain-merge',
        defaultParams: { x: 5, y: 'a' },
      })
    )

    const result = getTableQuery('test:plain-merge', {
      hostId: 1,
      searchParams: { y: 'override', z: 'new' },
    })

    expect(result?.queryParams).toEqual({ x: 5, y: 'override', z: 'new' })
  })

  test('omits queryParams when there are none', () => {
    registerTableConfig(makeConfig({ name: 'test:plain-empty' }))

    const result = getTableQuery('test:plain-empty', { hostId: 0 })

    expect(result?.queryParams).toBeUndefined()
  })
})

describe('getTableQuery — filterSchema path', () => {
  const userFilterSchema: FilterSchema = {
    fields: [
      {
        key: 'user',
        column: 'user',
        label: 'User',
        type: 'text',
        operators: ['eq', 'ne'],
      },
    ],
  }

  const filteredSql = `SELECT * FROM system.query_log ${FILTER_PLACEHOLDER} ORDER BY event_time`

  test('injects a parameterized WHERE clause from active filters', () => {
    registerTableConfig(
      makeConfig({
        name: 'test:filtered',
        sql: filteredSql,
        filterSchema: userFilterSchema,
      })
    )

    const result = getTableQuery('test:filtered', {
      hostId: 0,
      searchParams: { user: 'eq:default' },
    })

    // Placeholder replaced with the built clause referencing the column.
    expect(result?.query).not.toContain(FILTER_PLACEHOLDER)
    expect(result?.query).toContain('user =')
    // The parameter value is surfaced for substitution.
    expect(result?.queryParams).toMatchObject({ flt_0: 'default' })
  })

  test('does not mutate the registered config (returns a fresh clone)', () => {
    registerTableConfig(
      makeConfig({
        name: 'test:filtered-immut',
        sql: filteredSql,
        filterSchema: userFilterSchema,
      })
    )

    getTableQuery('test:filtered-immut', {
      hostId: 0,
      searchParams: { user: 'eq:default' },
    })

    // Re-running must not accumulate clauses — the stored template is intact.
    expect(getTableConfig('test:filtered-immut')?.sql).toBe(filteredSql)
  })

  test('merges defaultParams with filter params', () => {
    registerTableConfig(
      makeConfig({
        name: 'test:filtered-defaults',
        sql: filteredSql,
        filterSchema: userFilterSchema,
        defaultParams: { limit: 250 },
      })
    )

    const result = getTableQuery('test:filtered-defaults', {
      hostId: 0,
      searchParams: { user: 'eq:bob' },
    })

    expect(result?.queryParams).toMatchObject({ limit: 250, flt_0: 'bob' })
  })

  test('handles no active filters — placeholder removed, no params', () => {
    registerTableConfig(
      makeConfig({
        name: 'test:filtered-noactive',
        sql: filteredSql,
        filterSchema: userFilterSchema,
      })
    )

    const result = getTableQuery('test:filtered-noactive', { hostId: 0 })

    expect(result?.query).not.toContain(FILTER_PLACEHOLDER)
    expect(result?.queryParams).toBeUndefined()
  })
})
