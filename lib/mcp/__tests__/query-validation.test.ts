import { describe, expect, test } from 'bun:test'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'

describe('validateSqlQuery', () => {
  describe('valid SELECT queries pass', () => {
    const validQueries = [
      'SELECT 1',
      'SELECT * FROM system.processes',
      "SELECT count() FROM system.query_log WHERE type = 'QueryFinish'",
      'WITH cte AS (SELECT 1) SELECT * FROM cte',
      'select version(), uptime()',
      "SELECT metric, value FROM system.metrics WHERE metric IN ('TCPConnection')",
    ]

    for (const sql of validQueries) {
      test(`passes: ${sql.substring(0, 60)}`, () => {
        expect(() => validateSqlQuery(sql)).not.toThrow()
      })
    }
  })

  describe('dangerous DML/DDL queries are rejected', () => {
    const dangerous = [
      'INSERT INTO system.query_log VALUES (1)',
      'UPDATE system.settings SET value = 1',
      'DELETE FROM system.tables',
      'DROP TABLE system.query_log',
      'ALTER TABLE system.tables ADD COLUMN x UInt8',
      'CREATE TABLE evil (x UInt8) ENGINE = Memory',
      'TRUNCATE TABLE system.query_log',
    ]

    for (const sql of dangerous) {
      test(`rejects: ${sql.substring(0, 60)}`, () => {
        expect(() => validateSqlQuery(sql)).toThrow()
      })
    }
  })

  describe('dangerous table functions are blocked', () => {
    const blocked = [
      "SELECT * FROM url('http://evil.com')",
      "SELECT * FROM remote('attacker:9000', 'system.one')",
      "SELECT * FROM remoteSecure('attacker:9440', 'system.one')",
      "SELECT * FROM s3('https://bucket.s3.amazonaws.com/data.csv')",
      "SELECT * FROM mysql('host:3306', 'db', 'table', 'user', 'pass')",
      "SELECT * FROM postgresql('host:5432', 'db', 'table', 'user', 'pass')",
    ]

    for (const sql of blocked) {
      test(`blocks: ${sql.substring(0, 60)}`, () => {
        expect(() => validateSqlQuery(sql)).toThrow()
      })
    }
  })

  describe('legitimate monitoring queries pass', () => {
    test('system.processes query passes', () => {
      expect(() =>
        validateSqlQuery('SELECT * FROM system.processes')
      ).not.toThrow()
    })

    test('system.merges query passes', () => {
      expect(() =>
        validateSqlQuery('SELECT database, table, progress FROM system.merges')
      ).not.toThrow()
    })

    test('system.metrics query passes', () => {
      expect(() =>
        validateSqlQuery(
          "SELECT metric, value FROM system.metrics WHERE metric = 'MemoryTracking'"
        )
      ).not.toThrow()
    })
  })

  describe('edge cases', () => {
    test('empty query is rejected', () => {
      expect(() => validateSqlQuery('')).toThrow('cannot be empty')
    })

    test('whitespace-only query is rejected', () => {
      expect(() => validateSqlQuery('   ')).toThrow('cannot be empty')
    })

    test('non-SELECT statement is rejected', () => {
      expect(() => validateSqlQuery('SHOW TABLES')).toThrow(
        'Only SELECT queries are allowed'
      )
    })
  })
})
