import { describe, expect, test } from 'bun:test'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'

describe('MCP Query Validation', () => {
  describe('valid queries', () => {
    test('allows SELECT', () => {
      expect(() => validateSqlQuery('SELECT 1')).not.toThrow()
    })

    test('allows WITH (CTE)', () => {
      expect(() =>
        validateSqlQuery('WITH cte AS (SELECT 1) SELECT * FROM cte')
      ).not.toThrow()
    })

    test('allows system table queries', () => {
      expect(() =>
        validateSqlQuery('SELECT * FROM system.processes')
      ).not.toThrow()
    })

    test('allows system.query_log', () => {
      expect(() =>
        validateSqlQuery(
          'SELECT query_id, query_duration_ms FROM system.query_log LIMIT 10'
        )
      ).not.toThrow()
    })
  })

  describe('blocked queries', () => {
    test('rejects INSERT', () => {
      expect(() => validateSqlQuery('INSERT INTO table VALUES (1)')).toThrow()
    })

    test('rejects DROP', () => {
      expect(() => validateSqlQuery('DROP TABLE users')).toThrow()
    })

    test('rejects DELETE', () => {
      expect(() => validateSqlQuery('DELETE FROM users')).toThrow()
    })

    test('rejects UPDATE', () => {
      expect(() => validateSqlQuery('UPDATE users SET name = 1')).toThrow()
    })
  })

  describe('dangerous table functions', () => {
    test('blocks url()', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM url('http://evil.com/data', CSV)")
      ).toThrow()
    })

    test('blocks remote()', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM remote('attacker:9000', 'system.one')")
      ).toThrow()
    })

    test('blocks remoteSecure()', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM remoteSecure('host:9440', 'db', 'tbl')")
      ).toThrow()
    })

    test('blocks s3()', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM s3('https://bucket/key', CSV)")
      ).toThrow()
    })

    test('blocks mysql()', () => {
      expect(() =>
        validateSqlQuery(
          "SELECT * FROM mysql('host:3306', 'db', 'tbl', 'u', 'p')"
        )
      ).toThrow()
    })

    test('blocks postgresql()', () => {
      expect(() =>
        validateSqlQuery(
          "SELECT * FROM postgresql('host', 'db', 'tbl', 'u', 'p')"
        )
      ).toThrow()
    })
  })

  describe('edge cases', () => {
    test('rejects empty query', () => {
      expect(() => validateSqlQuery('')).toThrow()
    })

    test('rejects whitespace-only query', () => {
      expect(() => validateSqlQuery('   ')).toThrow()
    })

    test('rejects non-SELECT starting queries', () => {
      expect(() => validateSqlQuery('SHOW TABLES')).toThrow()
    })
  })
})
