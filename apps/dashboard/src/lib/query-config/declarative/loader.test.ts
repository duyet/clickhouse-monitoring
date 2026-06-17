/**
 * Tests for the declarative config loader (Plan 02b).
 *
 * Golden fixture: warningsConfig — the simplest real config with no ColumnFormat
 * imports, no runtime functions (no expandable/rowClassName/permission), just
 * name, sql (string), columns, optional, tableCheck, refreshInterval,
 * description, card, defaultView.
 */

import { getConfigSource, loadDeclarativeConfig } from './loader'
import { describe, expect, test } from 'bun:test'
import { warningsConfig } from '@/lib/query-config/system/warnings'

// ---------------------------------------------------------------------------
// getConfigSource — flag behaviour
// ---------------------------------------------------------------------------

describe('getConfigSource', () => {
  test('defaults to "ts" with no env set', () => {
    expect(getConfigSource({})).toBe('ts')
  })

  test('returns "declarative" when CHM_CONFIG_SOURCE=declarative', () => {
    expect(getConfigSource({ CHM_CONFIG_SOURCE: 'declarative' })).toBe(
      'declarative'
    )
  })

  test('returns "ts" for any value other than "declarative"', () => {
    expect(getConfigSource({ CHM_CONFIG_SOURCE: 'json' })).toBe('ts')
    expect(getConfigSource({ CHM_CONFIG_SOURCE: 'yaml' })).toBe('ts')
    expect(getConfigSource({ CHM_CONFIG_SOURCE: '' })).toBe('ts')
    expect(getConfigSource({ CHM_CONFIG_SOURCE: 'DECLARATIVE' })).toBe('ts') // case-sensitive
  })

  test('returns "ts" when runtimeEnv is empty', () => {
    // import.meta.env.VITE_CONFIG_SOURCE is undefined in test — defaults to 'ts'
    expect(getConfigSource({})).toBe('ts')
  })
})

// ---------------------------------------------------------------------------
// loadDeclarativeConfig — error cases
// ---------------------------------------------------------------------------

describe('loadDeclarativeConfig — invalid input', () => {
  test('throws on non-object input', () => {
    expect(() => loadDeclarativeConfig('not an object')).toThrow(
      'Invalid declarative query config'
    )
  })

  test('throws on missing name', () => {
    expect(() =>
      loadDeclarativeConfig({ sql: 'SELECT 1', columns: ['x'] })
    ).toThrow('Invalid declarative query config')
  })

  test('throws on missing sql', () => {
    expect(() =>
      loadDeclarativeConfig({ name: 'test', columns: ['x'] })
    ).toThrow('Invalid declarative query config')
  })

  test('throws on empty columns array', () => {
    expect(() =>
      loadDeclarativeConfig({ name: 'test', sql: 'SELECT 1', columns: [] })
    ).toThrow('Invalid declarative query config')
  })

  test('error message includes field-level details', () => {
    let message = ''
    try {
      loadDeclarativeConfig({ sql: 'SELECT 1', columns: ['x'] })
    } catch (err) {
      message = (err as Error).message
    }
    expect(message).toContain('name')
  })
})

// ---------------------------------------------------------------------------
// Golden fixture: warningsConfig
//
// warningsConfig fields (all serializable — no runtime functions):
//   name, description, optional, tableCheck, refreshInterval,
//   sql (string), columns, card, defaultView
//
// Excluded from comparison (not in DeclarativeQueryConfig schema):
//   none — warningsConfig has no runtime-only fields
// ---------------------------------------------------------------------------

// Declarative equivalent of warningsConfig, authored inline.
// Must match declarativeQueryConfigSchema exactly.
const warningsDeclarative = {
  name: 'warnings',
  description:
    'Server-side warnings about potential configuration or operational issues',
  optional: true,
  tableCheck: 'system.warnings',
  refreshInterval: 30_000,
  sql: 'SELECT message FROM system.warnings',
  columns: ['message'],
  card: { primary: 'message' },
  defaultView: 'auto' as const,
}

describe('loadDeclarativeConfig — golden fixture (warningsConfig)', () => {
  test('produces a valid QueryConfig from the declarative equivalent', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded).toBeDefined()
    expect(typeof loaded).toBe('object')
  })

  test('name matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.name).toBe(warningsConfig.name)
  })

  test('sql matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.sql).toBe(warningsConfig.sql)
  })

  test('columns match', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.columns).toEqual(warningsConfig.columns)
  })

  test('optional matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    // warningsConfig.optional is explicitly true; schema default is false
    expect(loaded.optional).toBe(warningsConfig.optional)
  })

  test('tableCheck matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.tableCheck).toBe(warningsConfig.tableCheck)
  })

  test('refreshInterval matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.refreshInterval).toBe(warningsConfig.refreshInterval)
  })

  test('description matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.description).toBe(warningsConfig.description)
  })

  test('card matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.card).toEqual(warningsConfig.card)
  })

  test('defaultView matches', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)
    expect(loaded.defaultView).toBe(warningsConfig.defaultView)
  })

  test('deep-equals on all serializable fields', () => {
    const loaded = loadDeclarativeConfig(warningsDeclarative)

    // Pick only the serializable fields present on warningsConfig for the
    // comparison. Runtime-only fields (columnIcons, rowClassName, expandable,
    // permission, filterSchema, clickhouseSettings, variants) are absent from
    // warningsConfig so nothing to exclude here.
    const serializable = {
      name: warningsConfig.name,
      sql: warningsConfig.sql,
      columns: warningsConfig.columns,
      optional: warningsConfig.optional,
      tableCheck: warningsConfig.tableCheck,
      refreshInterval: warningsConfig.refreshInterval,
      description: warningsConfig.description,
      card: warningsConfig.card,
      defaultView: warningsConfig.defaultView,
    }

    // Loaded config must contain all serializable fields with matching values.
    for (const [key, value] of Object.entries(serializable)) {
      expect((loaded as unknown as Record<string, unknown>)[key]).toEqual(value)
    }
  })
})
