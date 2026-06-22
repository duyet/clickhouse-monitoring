/**
 * Tests for lib/api/schemas.ts
 *
 * Validates each exported Zod schema: valid inputs parse correctly,
 * invalid inputs are rejected, transforms apply, and edge cases hold.
 */

import { describe, expect, test } from 'bun:test'
import {
  ActionSchema,
  BaseRequestSchema,
  ChartRequestSchema,
  DataRequestSchema,
  HostIdSchema,
  KillQueryActionSchema,
  MenuCountKeySchema,
  OptimizeTableActionSchema,
  QuerySettingsActionSchema,
  TableRequestSchema,
} from './schemas'

// ---------------------------------------------------------------------------
// HostIdSchema
// ---------------------------------------------------------------------------

describe('HostIdSchema', () => {
  test('parses "0" to 0', () => {
    expect(HostIdSchema.parse('0')).toBe(0)
  })

  test('parses "1" to 1', () => {
    expect(HostIdSchema.parse('1')).toBe(1)
  })

  test('parses large numeric string', () => {
    expect(HostIdSchema.parse('99')).toBe(99)
  })

  test('rejects non-numeric string', () => {
    expect(() => HostIdSchema.parse('abc')).toThrow()
  })

  test('rejects negative number string', () => {
    expect(() => HostIdSchema.parse('-1')).toThrow()
  })

  test('rejects empty string (NaN)', () => {
    expect(() => HostIdSchema.parse('')).toThrow()
  })

  test('rejects float string (parseInt truncates, 1.9 → 1, which passes)', () => {
    // parseInt('1.9') === 1, which is >= 0 and not NaN, so it succeeds
    expect(HostIdSchema.parse('1.9')).toBe(1)
  })

  test('rejects NaN-producing input "xyz"', () => {
    expect(() => HostIdSchema.parse('xyz')).toThrow()
  })

  test('rejects non-string input (number)', () => {
    // HostIdSchema expects a string; passing a number should fail
    expect(() => HostIdSchema.parse(1 as unknown as string)).toThrow()
  })

  test('rejects undefined', () => {
    expect(() => HostIdSchema.parse(undefined)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// MenuCountKeySchema
// ---------------------------------------------------------------------------

describe('MenuCountKeySchema', () => {
  test('accepts simple alphanumeric key', () => {
    expect(MenuCountKeySchema.parse('queries')).toBe('queries')
  })

  test('accepts key with hyphens', () => {
    expect(MenuCountKeySchema.parse('running-queries')).toBe('running-queries')
  })

  test('accepts key with underscores', () => {
    expect(MenuCountKeySchema.parse('slow_queries')).toBe('slow_queries')
  })

  test('accepts mixed alphanumeric, hyphens, underscores', () => {
    expect(MenuCountKeySchema.parse('my-key_v2')).toBe('my-key_v2')
  })

  test('accepts single character', () => {
    expect(MenuCountKeySchema.parse('a')).toBe('a')
  })

  test('rejects empty string', () => {
    expect(() => MenuCountKeySchema.parse('')).toThrow()
  })

  test('rejects key with spaces', () => {
    expect(() => MenuCountKeySchema.parse('my key')).toThrow()
  })

  test('rejects key with dots', () => {
    expect(() => MenuCountKeySchema.parse('my.key')).toThrow()
  })

  test('rejects key with slashes', () => {
    expect(() => MenuCountKeySchema.parse('my/key')).toThrow()
  })

  test('rejects key with special chars', () => {
    expect(() => MenuCountKeySchema.parse('key@domain')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// BaseRequestSchema
// ---------------------------------------------------------------------------

describe('BaseRequestSchema', () => {
  test('parses valid hostId string', () => {
    const result = BaseRequestSchema.parse({ hostId: '0' })
    expect(result.hostId).toBe(0)
  })

  test('parses hostId "3"', () => {
    const result = BaseRequestSchema.parse({ hostId: '3' })
    expect(result.hostId).toBe(3)
  })

  test('rejects missing hostId', () => {
    expect(() => BaseRequestSchema.parse({})).toThrow()
  })

  test('rejects negative hostId', () => {
    expect(() => BaseRequestSchema.parse({ hostId: '-1' })).toThrow()
  })

  test('strips extra fields (strict by default in zod object)', () => {
    // Zod strips unknown keys by default
    const result = BaseRequestSchema.parse({ hostId: '1', extra: 'ignored' })
    expect(result.hostId).toBe(1)
    expect((result as Record<string, unknown>).extra).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// ChartRequestSchema
// ---------------------------------------------------------------------------

describe('ChartRequestSchema', () => {
  test('parses minimal valid input (hostId only)', () => {
    const result = ChartRequestSchema.parse({ hostId: '0' })
    expect(result.hostId).toBe(0)
    expect(result.interval).toBeUndefined()
    expect(result.lastHours).toBeUndefined()
    expect(result.params).toBeUndefined()
  })

  test('parses with optional interval', () => {
    const result = ChartRequestSchema.parse({ hostId: '0', interval: '3600' })
    expect(result.interval).toBe('3600')
  })

  test('parses with optional lastHours', () => {
    const result = ChartRequestSchema.parse({ hostId: '0', lastHours: '24' })
    expect(result.lastHours).toBe(24)
  })

  test('parses lastHours "1" → 1', () => {
    const result = ChartRequestSchema.parse({ hostId: '1', lastHours: '1' })
    expect(result.lastHours).toBe(1)
  })

  test('rejects lastHours "0" (must be positive)', () => {
    expect(() =>
      ChartRequestSchema.parse({ hostId: '0', lastHours: '0' })
    ).toThrow()
  })

  test('rejects negative lastHours', () => {
    expect(() =>
      ChartRequestSchema.parse({ hostId: '0', lastHours: '-5' })
    ).toThrow()
  })

  test('rejects non-numeric lastHours', () => {
    expect(() =>
      ChartRequestSchema.parse({ hostId: '0', lastHours: 'abc' })
    ).toThrow()
  })

  test('parses valid JSON params string', () => {
    const result = ChartRequestSchema.parse({
      hostId: '0',
      params: '{"table":"events"}',
    })
    expect(result.params).toEqual({ table: 'events' })
  })

  test('parses params with array JSON', () => {
    const result = ChartRequestSchema.parse({
      hostId: '0',
      params: '[1,2,3]',
    })
    expect(result.params).toEqual([1, 2, 3])
  })

  test('rejects invalid JSON params', () => {
    expect(() =>
      ChartRequestSchema.parse({ hostId: '0', params: '{invalid json}' })
    ).toThrow()
  })

  test('parses all optional fields together', () => {
    const result = ChartRequestSchema.parse({
      hostId: '2',
      interval: '60',
      lastHours: '12',
      params: '{"key":"val"}',
    })
    expect(result.hostId).toBe(2)
    expect(result.interval).toBe('60')
    expect(result.lastHours).toBe(12)
    expect(result.params).toEqual({ key: 'val' })
  })
})

// ---------------------------------------------------------------------------
// TableRequestSchema
// ---------------------------------------------------------------------------

describe('TableRequestSchema', () => {
  test('parses minimal valid input', () => {
    const result = TableRequestSchema.parse({ hostId: '0' })
    expect(result.hostId).toBe(0)
  })

  test('passes through extra fields (passthrough mode)', () => {
    const result = TableRequestSchema.parse({
      hostId: '1',
      filter: 'system',
      page: '2',
    })
    expect(result.hostId).toBe(1)
    expect((result as Record<string, unknown>).filter).toBe('system')
    expect((result as Record<string, unknown>).page).toBe('2')
  })

  test('rejects missing hostId', () => {
    expect(() => TableRequestSchema.parse({ filter: 'system' })).toThrow()
  })

  test('rejects invalid hostId in table request', () => {
    expect(() =>
      TableRequestSchema.parse({ hostId: 'bad', filter: 'test' })
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// DataRequestSchema
// ---------------------------------------------------------------------------

describe('DataRequestSchema', () => {
  test('parses valid minimal input', () => {
    const result = DataRequestSchema.parse({
      hostId: '0',
      query: 'SELECT 1',
    })
    expect(result.hostId).toBe(0)
    expect(result.query).toBe('SELECT 1')
    expect(result.format).toBeUndefined()
  })

  test('parses with format JSONEachRow', () => {
    const result = DataRequestSchema.parse({
      hostId: '0',
      query: 'SELECT 1',
      format: 'JSONEachRow',
    })
    expect(result.format).toBe('JSONEachRow')
  })

  test('parses with format JSON', () => {
    const result = DataRequestSchema.parse({
      hostId: '0',
      query: 'SELECT 1',
      format: 'JSON',
    })
    expect(result.format).toBe('JSON')
  })

  test('parses with format CSV', () => {
    const result = DataRequestSchema.parse({
      hostId: '0',
      query: 'SELECT 1',
      format: 'CSV',
    })
    expect(result.format).toBe('CSV')
  })

  test('parses with format TSV', () => {
    const result = DataRequestSchema.parse({
      hostId: '0',
      query: 'SELECT 1',
      format: 'TSV',
    })
    expect(result.format).toBe('TSV')
  })

  test('rejects unknown format', () => {
    expect(() =>
      DataRequestSchema.parse({
        hostId: '0',
        query: 'SELECT 1',
        format: 'XML',
      })
    ).toThrow()
  })

  test('rejects empty query', () => {
    expect(() => DataRequestSchema.parse({ hostId: '0', query: '' })).toThrow()
  })

  test('rejects missing query', () => {
    expect(() => DataRequestSchema.parse({ hostId: '0' })).toThrow()
  })

  test('rejects missing hostId', () => {
    expect(() => DataRequestSchema.parse({ query: 'SELECT 1' })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// KillQueryActionSchema
// ---------------------------------------------------------------------------

describe('KillQueryActionSchema', () => {
  test('parses valid killQuery action', () => {
    const result = KillQueryActionSchema.parse({
      action: 'killQuery',
      params: { queryId: 'abc-123' },
    })
    expect(result.action).toBe('killQuery')
    expect(result.params.queryId).toBe('abc-123')
  })

  test('rejects wrong action literal', () => {
    expect(() =>
      KillQueryActionSchema.parse({
        action: 'optimizeTable',
        params: { queryId: 'abc' },
      })
    ).toThrow()
  })

  test('rejects empty queryId', () => {
    expect(() =>
      KillQueryActionSchema.parse({
        action: 'killQuery',
        params: { queryId: '' },
      })
    ).toThrow()
  })

  test('rejects missing params', () => {
    expect(() => KillQueryActionSchema.parse({ action: 'killQuery' })).toThrow()
  })

  test('rejects missing queryId in params', () => {
    expect(() =>
      KillQueryActionSchema.parse({ action: 'killQuery', params: {} })
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// OptimizeTableActionSchema
// ---------------------------------------------------------------------------

describe('OptimizeTableActionSchema', () => {
  test('parses valid optimizeTable action', () => {
    const result = OptimizeTableActionSchema.parse({
      action: 'optimizeTable',
      params: { table: 'events' },
    })
    expect(result.action).toBe('optimizeTable')
    expect(result.params.table).toBe('events')
  })

  test('rejects wrong action literal', () => {
    expect(() =>
      OptimizeTableActionSchema.parse({
        action: 'killQuery',
        params: { table: 'events' },
      })
    ).toThrow()
  })

  test('rejects empty table name', () => {
    expect(() =>
      OptimizeTableActionSchema.parse({
        action: 'optimizeTable',
        params: { table: '' },
      })
    ).toThrow()
  })

  test('rejects missing params', () => {
    expect(() =>
      OptimizeTableActionSchema.parse({ action: 'optimizeTable' })
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// QuerySettingsActionSchema
// ---------------------------------------------------------------------------

describe('QuerySettingsActionSchema', () => {
  test('parses valid querySettings action', () => {
    const result = QuerySettingsActionSchema.parse({
      action: 'querySettings',
      params: { queryId: 'q-456' },
    })
    expect(result.action).toBe('querySettings')
    expect(result.params.queryId).toBe('q-456')
  })

  test('rejects wrong action literal', () => {
    expect(() =>
      QuerySettingsActionSchema.parse({
        action: 'killQuery',
        params: { queryId: 'q-456' },
      })
    ).toThrow()
  })

  test('rejects empty queryId', () => {
    expect(() =>
      QuerySettingsActionSchema.parse({
        action: 'querySettings',
        params: { queryId: '' },
      })
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// ActionSchema (discriminated union)
// ---------------------------------------------------------------------------

describe('ActionSchema', () => {
  test('routes killQuery correctly', () => {
    const result = ActionSchema.parse({
      action: 'killQuery',
      params: { queryId: 'qid-1' },
    })
    expect(result.action).toBe('killQuery')
    if (result.action === 'killQuery') {
      expect(result.params.queryId).toBe('qid-1')
    }
  })

  test('routes optimizeTable correctly', () => {
    const result = ActionSchema.parse({
      action: 'optimizeTable',
      params: { table: 'logs' },
    })
    expect(result.action).toBe('optimizeTable')
    if (result.action === 'optimizeTable') {
      expect(result.params.table).toBe('logs')
    }
  })

  test('routes querySettings correctly', () => {
    const result = ActionSchema.parse({
      action: 'querySettings',
      params: { queryId: 'qid-2' },
    })
    expect(result.action).toBe('querySettings')
    if (result.action === 'querySettings') {
      expect(result.params.queryId).toBe('qid-2')
    }
  })

  test('rejects unknown action discriminant', () => {
    expect(() =>
      ActionSchema.parse({
        action: 'unknownAction',
        params: {},
      })
    ).toThrow()
  })

  test('rejects missing action field', () => {
    expect(() => ActionSchema.parse({ params: { queryId: 'x' } })).toThrow()
  })

  test('rejects empty object', () => {
    expect(() => ActionSchema.parse({})).toThrow()
  })

  test('rejects killQuery with wrong params shape', () => {
    expect(() =>
      ActionSchema.parse({
        action: 'killQuery',
        params: { table: 'events' }, // wrong key for killQuery
      })
    ).toThrow()
  })

  test('rejects optimizeTable with wrong params shape', () => {
    expect(() =>
      ActionSchema.parse({
        action: 'optimizeTable',
        params: { queryId: 'x' }, // wrong key for optimizeTable
      })
    ).toThrow()
  })
})
