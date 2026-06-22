import { formatSql } from './sql-format'
import { describe, expect, test } from 'bun:test'

describe('formatSql', () => {
  // --- basic formatting ---

  test('uppercases SQL keywords', async () => {
    const result = await formatSql('select 1')
    expect(result).toContain('SELECT')
  })

  test('formats a simple SELECT query', async () => {
    const result = await formatSql('select id, name from users where id = 1')
    expect(result).toContain('SELECT')
    expect(result).toContain('FROM')
    expect(result).toContain('WHERE')
  })

  test('preserves identifier case (tables, columns)', async () => {
    const result = await formatSql(
      'SELECT myColumn FROM myTable WHERE myTable.id = 1'
    )
    expect(result).toContain('myColumn')
    expect(result).toContain('myTable')
  })

  test('indents with 2-space tab width', async () => {
    const result = await formatSql('SELECT a, b FROM t WHERE a = 1 AND b = 2')
    // At least one line should start with exactly two spaces (the indented portion).
    const lines = result.split('\n')
    const indentedLines = lines.filter((l) => /^ {2}\S/.test(l))
    expect(indentedLines.length).toBeGreaterThan(0)
  })

  test('formats multi-line SQL', async () => {
    const sql = `SELECT\n  id,\n  name\nFROM users`
    const result = await formatSql(sql)
    expect(result).toContain('SELECT')
    expect(result).toContain('FROM')
  })

  test('formats already-uppercased SQL without breaking it', async () => {
    const result = await formatSql('SELECT 1')
    expect(result.trim()).toBe('SELECT\n  1')
  })

  // --- opts override ---

  test('accepts options override — lowercase keywords', async () => {
    const result = await formatSql('SELECT 1', { keywordCase: 'lower' })
    expect(result).toContain('select')
    expect(result).not.toMatch(/\bSELECT\b/)
  })

  test('accepts options override — different tab width', async () => {
    const result = await formatSql('SELECT a, b FROM t', { tabWidth: 4 })
    const lines = result.split('\n')
    const indentedLines = lines.filter((l) => /^ {4}\S/.test(l))
    expect(indentedLines.length).toBeGreaterThan(0)
  })

  // --- empty / trivial inputs ---

  test('empty string returns empty or whitespace-only string', async () => {
    const result = await formatSql('')
    expect(result.trim()).toBe('')
  })

  test('whitespace-only string returns empty or whitespace-only string', async () => {
    const result = await formatSql('   ')
    expect(result.trim()).toBe('')
  })

  // --- fallback behavior ---

  test('returns a string (never throws) for malformed SQL', async () => {
    // sql-formatter tolerates most junk strings, so we just verify it always resolves
    await expect(formatSql('NOT VALID @@@ SQL !!!')).resolves.toBeTypeOf(
      'string'
    )
  })

  test('returns a string (never throws) for binary-like garbage', async () => {
    await expect(formatSql('\x00\x01\x02\x03')).resolves.toBeTypeOf('string')
  })

  // --- ClickHouse-specific patterns ---

  test('formats ClickHouse system table queries', async () => {
    const sql =
      'select query, read_rows, memory_usage from system.query_log where type = 2 order by query_duration_ms desc limit 10'
    const result = await formatSql(sql)
    expect(result).toContain('SELECT')
    expect(result).toContain('FROM')
    expect(result).toContain('WHERE')
    expect(result).toContain('ORDER BY')
    expect(result).toContain('LIMIT')
    // Identifier case preserved
    expect(result).toContain('system.query_log')
  })

  test('formats ClickHouse aggregate functions', async () => {
    const sql =
      'select countIf(type = 2), sumIf(memory_usage, type = 2) from system.query_log'
    const result = await formatSql(sql)
    expect(result).toContain('SELECT')
    // Function names are identifiers — case preserved
    expect(result).toContain('countIf')
    expect(result).toContain('sumIf')
  })

  test('formats JOIN queries', async () => {
    const sql = 'select a.id, b.name from tableA a join tableB b on a.id = b.id'
    const result = await formatSql(sql)
    expect(result).toContain('SELECT')
    expect(result).toContain('JOIN')
    expect(result).toContain('ON')
    // Identifier case preserved
    expect(result).toContain('tableA')
    expect(result).toContain('tableB')
  })

  // --- return type ---

  test('always returns a Promise<string>', async () => {
    const result = formatSql('SELECT 1')
    expect(result).toBeInstanceOf(Promise)
    const resolved = await result
    expect(typeof resolved).toBe('string')
  })
})
