import { stripTrailingFormat } from './sql-utils'
import { describe, expect, it } from 'bun:test'

describe('stripTrailingFormat', () => {
  it('removes a trailing FORMAT JSONEachRow clause', () => {
    expect(
      stripTrailingFormat('SELECT * FROM system.tables FORMAT JSONEachRow')
    ).toBe('SELECT * FROM system.tables')
  })

  it('removes FORMAT followed by a trailing semicolon', () => {
    expect(stripTrailingFormat('SELECT 1 FORMAT CSV;')).toBe('SELECT 1')
  })

  it('is case-insensitive on the FORMAT keyword', () => {
    expect(stripTrailingFormat('SELECT 1\nformat TabSeparated')).toBe(
      'SELECT 1'
    )
  })

  it('strips a bare trailing semicolon even without FORMAT', () => {
    expect(stripTrailingFormat('SELECT 1;')).toBe('SELECT 1')
  })

  it('leaves a query without a FORMAT clause unchanged', () => {
    const sql = 'SELECT record_type, count() FROM t GROUP BY 1'
    expect(stripTrailingFormat(sql)).toBe(sql)
  })

  it('does not strip the word FORMAT when it is not a trailing clause', () => {
    const sql = 'SELECT formatReadableSize(bytes) FROM system.parts'
    expect(stripTrailingFormat(sql)).toBe(sql)
  })

  it('handles empty input', () => {
    expect(stripTrailingFormat('')).toBe('')
  })
})
