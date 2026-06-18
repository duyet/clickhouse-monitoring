/**
 * MCP read-only enforcement lock-in tests (Plan 05a)
 *
 * Imports the REAL `validateSqlQuery` guard from `@chm/sql-builder` — the same
 * function the `query` MCP tool calls before executing any SQL — and asserts that
 * every write/DDL/control statement is rejected and every legitimate read query is
 * allowed. These tests are intentionally kept in the dashboard `src/` tree so
 * `bun test src/ --isolate` (the CI `dashboard` job) always runs them.
 *
 * Guard contract: `validateSqlQuery(sql: string): void` — throws `Error` on
 * reject, returns `undefined` on allow.
 *
 * @see packages/mcp-server/src/tools/query.ts  — the tool that calls the guard
 * @see packages/sql-builder/src/sql-validator.ts — the guard implementation
 */

import { describe, expect, test } from 'bun:test'
import { validateSqlQuery } from '@chm/sql-builder'

// ============================================================================
// Rejected statements — every case below MUST throw
// ============================================================================

describe('MCP read-only enforcement: rejected statements', () => {
  test('INSERT INTO', () => {
    expect(() => validateSqlQuery('INSERT INTO t VALUES (1)')).toThrow()
  })

  test('ALTER TABLE', () => {
    expect(() => validateSqlQuery('ALTER TABLE t ADD COLUMN x Int32')).toThrow()
  })

  test('DROP TABLE', () => {
    expect(() => validateSqlQuery('DROP TABLE users')).toThrow()
  })

  test('TRUNCATE TABLE', () => {
    expect(() => validateSqlQuery('TRUNCATE TABLE logs')).toThrow()
  })

  test('CREATE TABLE', () => {
    expect(() =>
      validateSqlQuery('CREATE TABLE x (id UInt32) ENGINE=MergeTree()')
    ).toThrow()
  })

  test('CREATE USER', () => {
    expect(() =>
      validateSqlQuery("CREATE USER alice IDENTIFIED BY 'secret'")
    ).toThrow()
  })

  test('RENAME TABLE', () => {
    expect(() => validateSqlQuery('RENAME TABLE old TO new')).toThrow()
  })

  test('OPTIMIZE TABLE', () => {
    // OPTIMIZE is a SYSTEM-level write operation — not a SELECT
    // The guard rejects it because it does not start with SELECT/WITH/DESCRIBE/EXPLAIN
    // and none of the dangerous keyword checks apply (it falls through to the
    // statement-type check at the end of validateSqlQuery).
    expect(() => validateSqlQuery('OPTIMIZE TABLE t FINAL')).toThrow()
  })

  test('SYSTEM RELOAD DICTIONARIES', () => {
    expect(() => validateSqlQuery('SYSTEM RELOAD DICTIONARIES')).toThrow()
  })

  test('SYSTEM FLUSH LOGS', () => {
    expect(() => validateSqlQuery('SYSTEM FLUSH LOGS')).toThrow()
  })

  test('GRANT privilege', () => {
    expect(() => validateSqlQuery('GRANT SELECT ON db.t TO alice')).toThrow()
  })

  test('ATTACH TABLE', () => {
    expect(() => validateSqlQuery('ATTACH TABLE t')).toThrow()
  })

  test('DETACH TABLE', () => {
    expect(() => validateSqlQuery('DETACH TABLE t')).toThrow()
  })

  test('DELETE (standalone)', () => {
    expect(() => validateSqlQuery('DELETE FROM t WHERE id = 1')).toThrow()
  })

  test('UPDATE (ClickHouse ALTER ... UPDATE)', () => {
    // ClickHouse mutation syntax contains ALTER which is caught first
    expect(() =>
      validateSqlQuery('ALTER TABLE t UPDATE col = 1 WHERE id = 1')
    ).toThrow()
  })

  test('ALTER TABLE DELETE (ClickHouse mutation)', () => {
    expect(() =>
      validateSqlQuery('ALTER TABLE t DELETE WHERE id > 100')
    ).toThrow()
  })

  test('multi-statement: SELECT then DROP (sneaky)', () => {
    expect(() => validateSqlQuery('SELECT 1; DROP TABLE users')).toThrow()
  })

  test('multi-statement: SELECT then INSERT', () => {
    expect(() =>
      validateSqlQuery('SELECT count() FROM t; INSERT INTO t VALUES (1)')
    ).toThrow()
  })

  test('SET session variable', () => {
    expect(() => validateSqlQuery('SET max_memory_usage = 0')).toThrow()
  })

  test('KILL QUERY', () => {
    expect(() => validateSqlQuery('KILL QUERY WHERE query_id = 1')).toThrow()
  })
})

// ============================================================================
// Allowed statements — every case below MUST NOT throw
// ============================================================================

describe('MCP read-only enforcement: allowed statements', () => {
  test('simple SELECT', () => {
    expect(() => validateSqlQuery('SELECT 1')).not.toThrow()
  })

  test('SELECT from system table', () => {
    expect(() =>
      validateSqlQuery('SELECT * FROM system.tables LIMIT 10')
    ).not.toThrow()
  })

  test('SELECT with WHERE and ORDER BY', () => {
    expect(() =>
      validateSqlQuery(
        'SELECT query_id, elapsed FROM system.processes ORDER BY elapsed DESC'
      )
    ).not.toThrow()
  })

  test('WITH … SELECT (CTE)', () => {
    expect(() =>
      validateSqlQuery(
        'WITH top AS (SELECT count() AS n FROM system.tables) SELECT n FROM top'
      )
    ).not.toThrow()
  })

  test('DESCRIBE TABLE', () => {
    expect(() =>
      validateSqlQuery('DESCRIBE TABLE system.query_log')
    ).not.toThrow()
  })

  // NOTE: DESC (short alias) is NOT allowed — only the full DESCRIBE keyword
  // passes the guard. Use DESCRIBE TABLE instead.

  test('EXPLAIN SELECT', () => {
    expect(() =>
      validateSqlQuery('EXPLAIN SELECT count() FROM system.tables')
    ).not.toThrow()
  })

  test('EXPLAIN PIPELINE SELECT', () => {
    expect(() =>
      validateSqlQuery('EXPLAIN PIPELINE SELECT * FROM system.processes')
    ).not.toThrow()
  })

  test('EXPLAIN AST SELECT', () => {
    expect(() => validateSqlQuery('EXPLAIN AST SELECT 1')).not.toThrow()
  })

  test('SELECT with a leading block comment (QUERY_COMMENT pattern)', () => {
    expect(() =>
      validateSqlQuery(
        '/* { "client": "clickhouse-monitoring" } */ SELECT * FROM system.processes'
      )
    ).not.toThrow()
  })

  test('SELECT with inline comment', () => {
    expect(() =>
      validateSqlQuery('SELECT /* read-only */ count() FROM system.tables')
    ).not.toThrow()
  })

  test('multiline SELECT', () => {
    expect(() =>
      validateSqlQuery(`
        SELECT
          user,
          count() AS cnt
        FROM system.query_log
        WHERE type = 'QueryFinish'
        GROUP BY user
        ORDER BY cnt DESC
        LIMIT 10
      `)
    ).not.toThrow()
  })
})
