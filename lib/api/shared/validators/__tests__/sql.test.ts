/**
 * SQL Validator Tests
 */

import { describe, expect, test } from '@jest/globals'
import { validateSqlQuery, SQL_PATTERNS } from '../sql'

describe('SQL_PATTERNS', () => {
  test('should have all required patterns', () => {
    expect(SQL_PATTERNS.DANGEROUS_KEYWORDS).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.EXECUTION_COMMANDS).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.LINE_COMMENT).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.BLOCK_COMMENT_START).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.BLOCK_COMMENT_END).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.CHAINED_DANGEROUS).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.STRING_INJECTION_SINGLE).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.STRING_INJECTION_DOUBLE).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.STRING_INJECTION_OR_SINGLE).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.TAUTOLOGY).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.UNION_INJECTION).toBeInstanceOf(RegExp)
  })

  describe('DANGEROUS_KEYWORDS pattern', () => {
    test('should match DROP keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('DROP TABLE users')).toBe(true)
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('drop table users')).toBe(true)
    })

    test('should match DELETE keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('DELETE FROM users')).toBe(true)
    })

    test('should match INSERT keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('INSERT INTO users')).toBe(true)
    })

    test('should match UPDATE keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('UPDATE users SET')).toBe(true)
    })

    test('should not match SELECT', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('SELECT * FROM users')).toBe(false)
    })
  })
})

describe('validateSqlQuery', () => {
  describe('valid queries', () => {
    test('should accept simple SELECT queries', () => {
      expect(() => validateSqlQuery('SELECT * FROM system.users')).not.toThrow()
      expect(() => validateSqlQuery('SELECT count() FROM system.tables')).not.toThrow()
    })

    test('should accept SELECT with WHERE clause', () => {
      expect(() =>
        validateSqlQuery('SELECT * FROM users WHERE name = {name:String}')
      ).not.toThrow()
    })

    test('should accept SELECT with parameterized queries', () => {
      expect(() =>
        validateSqlQuery('SELECT * FROM system.tables WHERE name = {name:String}')
      ).not.toThrow()
    })

    test('should accept WITH (CTE) queries', () => {
      expect(() =>
        validateSqlQuery('WITH cte AS (SELECT 1) SELECT * FROM cte')
      ).not.toThrow()
    })

    test('should accept complex SELECT queries', () => {
      expect(() =>
        validateSqlQuery(`
          SELECT
            user,
            count() as cnt
          FROM system.query_log
          WHERE type = 'QueryFinish'
          GROUP BY user
          ORDER BY cnt DESC
          LIMIT 10
        `)
      ).not.toThrow()
    })
  })

  describe('empty queries', () => {
    test('should reject empty string', () => {
      expect(() => validateSqlQuery('')).toThrow('SQL query cannot be empty')
    })

    test('should reject whitespace-only string', () => {
      expect(() => validateSqlQuery('   ')).toThrow('SQL query cannot be empty')
      expect(() => validateSqlQuery('\t\n')).toThrow('SQL query cannot be empty')
    })
  })

  describe('dangerous SQL keywords', () => {
    test('should reject DROP statements', () => {
      expect(() => validateSqlQuery('DROP TABLE users')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject DELETE statements', () => {
      expect(() => validateSqlQuery('DELETE FROM users WHERE id = 1')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject INSERT statements', () => {
      expect(() => validateSqlQuery('INSERT INTO users VALUES (1, "test")')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject UPDATE statements', () => {
      expect(() => validateSqlQuery('UPDATE users SET name = "test"')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject ALTER statements', () => {
      expect(() => validateSqlQuery('ALTER TABLE users ADD COLUMN age Int32')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject CREATE statements', () => {
      expect(() => validateSqlQuery('CREATE TABLE test (id Int32)')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject TRUNCATE statements', () => {
      expect(() => validateSqlQuery('TRUNCATE TABLE users')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })
  })

  describe('SQL injection patterns', () => {
    test('should reject EXEC/EXECUTE commands', () => {
      expect(() => validateSqlQuery("EXEC('DROP TABLE')")).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject line comments', () => {
      expect(() => validateSqlQuery('SELECT * FROM users -- comment')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject block comments', () => {
      expect(() => validateSqlQuery('SELECT /* comment */ * FROM users')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject chained dangerous statements', () => {
      expect(() => validateSqlQuery('SELECT * FROM users; DROP TABLE users')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject tautology attacks (1=1)', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM users WHERE name = '' OR 1=1")
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject UNION injection', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM users WHERE name = '' UNION SELECT * FROM passwords")
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject string-based injection', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM users WHERE name = '' OR '1'='1")
      ).toThrow('Potentially dangerous SQL detected')
    })
  })

  describe('non-SELECT queries', () => {
    test('should reject INSERT at start', () => {
      expect(() => validateSqlQuery('INSERT INTO users VALUES (1)')).toThrow()
    })

    test('should reject UPDATE at start', () => {
      expect(() => validateSqlQuery('UPDATE users SET x = 1')).toThrow()
    })

    test('should reject SHOW queries', () => {
      expect(() => validateSqlQuery('SHOW TABLES')).toThrow('Only SELECT queries are allowed')
    })

    test('should reject DESCRIBE queries', () => {
      expect(() => validateSqlQuery('DESCRIBE TABLE users')).toThrow(
        'Only SELECT queries are allowed'
      )
    })
  })
})
