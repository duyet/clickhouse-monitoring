import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

mock.module('@/lib/api/shared/validators/sql', () => ({
  validateSqlQuery: (sql: string) => {
    if (sql.trim().toUpperCase().startsWith('DROP')) {
      throw new Error('Write operations not allowed')
    }
  },
}))

mock.module('@/lib/clickhouse', () => ({
  fetchData: async ({ query, hostId }: { query: string; hostId: number }) => {
    if (hostId === 999) {
      return { data: null, error: { message: 'Host not found' } }
    }
    return { data: [{ result: query }], error: null }
  },
}))

const { resolveHostId, isValidTableIdentifier } = await import('../helpers')

describe('resolveHostId', () => {
  test('returns default when tool host ID is undefined', () => {
    expect(resolveHostId(undefined, 0)).toBe(0)
    expect(resolveHostId(undefined, 5)).toBe(5)
  })

  test('returns tool host ID when provided', () => {
    expect(resolveHostId(1, 0)).toBe(1)
    expect(resolveHostId(3, 3)).toBe(3)
  })
})

describe('isValidTableIdentifier', () => {
  test('accepts simple identifiers', () => {
    expect(isValidTableIdentifier('query_log')).toBe(true)
    expect(isValidTableIdentifier('my_table_123')).toBe(true)
    expect(isValidTableIdentifier('T')).toBe(true)
  })

  test('accepts backtick-quoted identifiers', () => {
    expect(isValidTableIdentifier('`my-table`')).toBe(true)
    expect(isValidTableIdentifier('`table.with.dots`')).toBe(true)
  })

  test('accepts database.table format', () => {
    expect(isValidTableIdentifier('system.query_log')).toBe(true)
    expect(isValidTableIdentifier('`my-db`.`my-table`')).toBe(true)
  })

  test('rejects empty strings', () => {
    expect(isValidTableIdentifier('')).toBe(false)
  })

  test('rejects overly long identifiers', () => {
    expect(isValidTableIdentifier('a'.repeat(257))).toBe(false)
  })

  test('rejects identifiers starting with digits', () => {
    expect(isValidTableIdentifier('123table')).toBe(false)
  })

  test('rejects identifiers with special characters', () => {
    expect(isValidTableIdentifier('table;DROP')).toBe(false)
    expect(isValidTableIdentifier("table'OR")).toBe(false)
  })
})
