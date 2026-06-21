import { splitSqlStatements } from '../split-statements'
import { describe, expect, it } from 'bun:test'

describe('splitSqlStatements', () => {
  it('returns a single statement unchanged', () => {
    expect(splitSqlStatements('SELECT * FROM system.tables LIMIT 100')).toEqual(
      ['SELECT * FROM system.tables LIMIT 100']
    )
  })

  it('strips a trailing semicolon (R3)', () => {
    expect(splitSqlStatements('SELECT 1;')).toEqual(['SELECT 1'])
    expect(splitSqlStatements('SELECT 1 ;  ')).toEqual(['SELECT 1'])
    expect(splitSqlStatements('SELECT 1;\n\n')).toEqual(['SELECT 1'])
  })

  it('splits multiple statements (R2)', () => {
    expect(splitSqlStatements('SELECT 1; SELECT 2')).toEqual([
      'SELECT 1',
      'SELECT 2',
    ])
    expect(splitSqlStatements('SELECT 1;\nSELECT 2;\nSELECT 3;')).toEqual([
      'SELECT 1',
      'SELECT 2',
      'SELECT 3',
    ])
  })

  it('ignores empty / whitespace-only fragments between semicolons', () => {
    expect(splitSqlStatements('SELECT 1;;;SELECT 2')).toEqual([
      'SELECT 1',
      'SELECT 2',
    ])
    expect(splitSqlStatements('  ;  ; SELECT 1 ; ; ')).toEqual(['SELECT 1'])
  })

  it('returns an empty array for blank input', () => {
    expect(splitSqlStatements('')).toEqual([])
    expect(splitSqlStatements('   \n  ')).toEqual([])
    expect(splitSqlStatements(';;;')).toEqual([])
  })

  it('does not split on a semicolon inside a single-quoted string', () => {
    expect(splitSqlStatements("SELECT ';' AS sep")).toEqual([
      "SELECT ';' AS sep",
    ])
    expect(splitSqlStatements("SELECT 'a;b'; SELECT 2")).toEqual([
      "SELECT 'a;b'",
      'SELECT 2',
    ])
  })

  it('handles doubled-quote and backslash escapes inside strings', () => {
    // Doubled single-quote escape: the inner '' is an escaped quote, so the ;
    // stays inside the string literal.
    expect(splitSqlStatements("SELECT 'it''s; ok' AS v")).toEqual([
      "SELECT 'it''s; ok' AS v",
    ])
    // Backslash-escaped quote keeps the string open across the ;.
    expect(splitSqlStatements("SELECT 'a\\'; b' AS v")).toEqual([
      "SELECT 'a\\'; b' AS v",
    ])
  })

  it('does not split on a semicolon inside a double-quoted string', () => {
    expect(splitSqlStatements('SELECT "a;b" AS v')).toEqual([
      'SELECT "a;b" AS v',
    ])
  })

  it('does not split on a semicolon inside a backtick identifier', () => {
    expect(splitSqlStatements('SELECT 1 FROM `weird;name`')).toEqual([
      'SELECT 1 FROM `weird;name`',
    ])
  })

  it('does not split on a semicolon inside a line comment', () => {
    expect(splitSqlStatements('SELECT 1 -- a;b\n; SELECT 2')).toEqual([
      'SELECT 1 -- a;b',
      'SELECT 2',
    ])
  })

  it('does not split on a semicolon inside a block comment', () => {
    expect(splitSqlStatements('SELECT 1 /* a;b */; SELECT 2')).toEqual([
      'SELECT 1 /* a;b */',
      'SELECT 2',
    ])
  })

  it('drops comment-only trailing fragments', () => {
    expect(splitSqlStatements('SELECT 1; -- trailing note')).toEqual([
      'SELECT 1',
    ])
    expect(splitSqlStatements('SELECT 1; /* note */')).toEqual(['SELECT 1'])
  })

  it('preserves leading comments on a real statement', () => {
    expect(splitSqlStatements('-- header\nSELECT 1')).toEqual([
      '-- header\nSELECT 1',
    ])
  })

  it('handles a realistic multi-statement script', () => {
    const script = `
      -- top databases by size
      SELECT database, formatReadableSize(sum(bytes)) AS size
      FROM system.parts
      WHERE active
      GROUP BY database;

      SELECT count() FROM system.tables;
    `
    expect(splitSqlStatements(script)).toEqual([
      `-- top databases by size
      SELECT database, formatReadableSize(sum(bytes)) AS size
      FROM system.parts
      WHERE active
      GROUP BY database`,
      'SELECT count() FROM system.tables',
    ])
  })
})
