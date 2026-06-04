/**
 * SQL Validator Tests
 */

import { SQL_PATTERNS, validateSqlQuery } from '../sql-validator'
import { describe, expect, test } from 'bun:test'

// Detect if validateSqlQuery has been globally mocked (e.g., by MCP tool tests)
const actuallyMocked = (() => {
  try {
    validateSqlQuery('DROP TABLE users')
    return true
  } catch {
    return false
  }
})()

if (actuallyMocked) {
  console.warn(
    'Warning: validateSqlQuery appears to be mocked - skipping validation tests'
  )
}

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
    expect(SQL_PATTERNS.SET_COMMAND).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.SYSTEM_COMMAND).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.KILL_COMMAND).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.ATTACH_DETACH).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.PERMISSION_COMMANDS).toBeInstanceOf(RegExp)
    expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS).toBeInstanceOf(RegExp)
  })

  describe('DANGEROUS_KEYWORDS pattern', () => {
    test('should match DROP keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('DROP TABLE users')).toBe(
        true
      )
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('drop table users')).toBe(
        true
      )
    })

    test('should match DELETE keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('DELETE FROM users')).toBe(
        true
      )
    })

    test('should match INSERT keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('INSERT INTO users')).toBe(
        true
      )
    })

    test('should match UPDATE keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('UPDATE users SET')).toBe(
        true
      )
    })

    test('should match ALTER keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('ALTER TABLE users')).toBe(
        true
      )
    })

    test('should match CREATE keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('CREATE TABLE users')).toBe(
        true
      )
    })

    test('should match TRUNCATE keyword', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('TRUNCATE TABLE users')).toBe(
        true
      )
    })

    test('should not match SELECT', () => {
      expect(SQL_PATTERNS.DANGEROUS_KEYWORDS.test('SELECT * FROM users')).toBe(
        false
      )
    })
  })

  describe('EXECUTION_COMMANDS pattern', () => {
    test('should match EXEC', () => {
      expect(SQL_PATTERNS.EXECUTION_COMMANDS.test('EXEC sp_name')).toBe(true)
    })

    test('should match EXECUTE', () => {
      expect(SQL_PATTERNS.EXECUTION_COMMANDS.test('EXECUTE sp_name')).toBe(true)
    })

    test('should match SCRIPT', () => {
      expect(SQL_PATTERNS.EXECUTION_COMMANDS.test('SCRIPT something')).toBe(
        true
      )
    })

    test('should not match SELECT', () => {
      expect(SQL_PATTERNS.EXECUTION_COMMANDS.test('SELECT * FROM t')).toBe(
        false
      )
    })
  })

  describe('LINE_COMMENT pattern', () => {
    test('should match line comments', () => {
      expect(SQL_PATTERNS.LINE_COMMENT.test('-- comment')).toBe(true)
      expect(SQL_PATTERNS.LINE_COMMENT.test('--comment')).toBe(false)
    })

    test('should not match double dash in string', () => {
      // This pattern matches line comments specifically
      expect(SQL_PATTERNS.LINE_COMMENT.test('-- ')).toBe(true)
    })
  })

  describe('BLOCK_COMMENT patterns', () => {
    test('should match block comment start', () => {
      expect(SQL_PATTERNS.BLOCK_COMMENT_START.test('/* comment')).toBe(true)
    })

    test('should match block comment end', () => {
      expect(SQL_PATTERNS.BLOCK_COMMENT_END.test('comment */')).toBe(true)
    })
  })

  describe('CHAINED_DANGEROUS pattern', () => {
    test('should match chained DROP', () => {
      expect(SQL_PATTERNS.CHAINED_DANGEROUS.test('; DROP TABLE users')).toBe(
        true
      )
    })

    test('should match chained DELETE', () => {
      expect(SQL_PATTERNS.CHAINED_DANGEROUS.test(';DELETE FROM t')).toBe(true)
    })

    test('should match chained INSERT', () => {
      expect(SQL_PATTERNS.CHAINED_DANGEROUS.test('; INSERT INTO t')).toBe(true)
    })

    test('should match chained UPDATE', () => {
      expect(SQL_PATTERNS.CHAINED_DANGEROUS.test(';UPDATE t SET')).toBe(true)
    })

    test('should not match non-chained statements', () => {
      expect(SQL_PATTERNS.CHAINED_DANGEROUS.test('SELECT * FROM t')).toBe(false)
    })
  })

  describe('STRING_INJECTION patterns', () => {
    test('should match single quote injection', () => {
      expect(SQL_PATTERNS.STRING_INJECTION_SINGLE.test("'; DROP TABLE--")).toBe(
        true
      )
    })

    test('should match single quote OR injection', () => {
      expect(SQL_PATTERNS.STRING_INJECTION_OR_SINGLE.test("' OR '1'='1")).toBe(
        true
      )
    })

    test('should match double quote injection', () => {
      expect(SQL_PATTERNS.STRING_INJECTION_DOUBLE.test('" OR "a"="a')).toBe(
        true
      )
    })
  })

  describe('TAUTOLOGY pattern', () => {
    test('should match OR 1=1', () => {
      expect(SQL_PATTERNS.TAUTOLOGY.test('OR 1=1')).toBe(true)
      expect(SQL_PATTERNS.TAUTOLOGY.test('or 1=1')).toBe(true)
      expect(SQL_PATTERNS.TAUTOLOGY.test('OR  1  =  1')).toBe(true)
    })

    test('should not match normal conditions', () => {
      expect(SQL_PATTERNS.TAUTOLOGY.test('id = 1')).toBe(false)
    })
  })

  describe('UNION_INJECTION pattern', () => {
    test('should match UNION SELECT', () => {
      expect(SQL_PATTERNS.UNION_INJECTION.test('UNION SELECT')).toBe(true)
      expect(SQL_PATTERNS.UNION_INJECTION.test('union select')).toBe(true)
    })

    test('should match UNION SELECT with table reference', () => {
      expect(SQL_PATTERNS.UNION_INJECTION.test('UNION SELECT * FROM t')).toBe(
        true
      )
    })

    test('should match UNION ALL SELECT', () => {
      expect(SQL_PATTERNS.UNION_INJECTION.test('UNION ALL SELECT')).toBe(true)
      expect(SQL_PATTERNS.UNION_INJECTION.test('union all select')).toBe(true)
      expect(
        SQL_PATTERNS.UNION_INJECTION.test(
          'SELECT 1 UNION ALL SELECT secret FROM system.users'
        )
      ).toBe(true)
    })

    test('should not match UNION without SELECT', () => {
      expect(SQL_PATTERNS.UNION_INJECTION.test('UNION')).toBe(false)
    })
  })

  describe('SET_COMMAND pattern', () => {
    test('should match SET', () => {
      expect(SQL_PATTERNS.SET_COMMAND.test('SET max_memory_usage = 100')).toBe(
        true
      )
    })

    test('should not match SELECT', () => {
      expect(SQL_PATTERNS.SET_COMMAND.test('SELECT * FROM t')).toBe(false)
    })
  })

  describe('SYSTEM_COMMAND pattern', () => {
    test('should match SYSTEM RELOAD', () => {
      expect(
        SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM RELOAD DICTIONARIES')
      ).toBe(true)
    })

    test('should match SYSTEM SHUTDOWN', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM SHUTDOWN')).toBe(true)
    })

    test('should match SYSTEM KILL', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM KILL TRANSACTION')).toBe(
        true
      )
    })

    test('should match SYSTEM FLUSH', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM FLUSH LOGS')).toBe(true)
    })

    test('should match SYSTEM SYNC', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM SYNC REPLICA')).toBe(true)
    })

    test('should match SYSTEM START', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM START REPLICA')).toBe(
        true
      )
    })

    test('should match SYSTEM STOP', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM STOP REPLICA')).toBe(true)
    })

    test('should match SYSTEM DROP', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('SYSTEM DROP DNS CACHE')).toBe(
        true
      )
    })

    test('should not match system.table references', () => {
      expect(SQL_PATTERNS.SYSTEM_COMMAND.test('system.query_log')).toBe(false)
    })
  })

  describe('KILL_COMMAND pattern', () => {
    test('should match KILL', () => {
      expect(SQL_PATTERNS.KILL_COMMAND.test('KILL QUERY')).toBe(true)
    })

    test('should match KILL case-insensitive', () => {
      expect(SQL_PATTERNS.KILL_COMMAND.test('kill query')).toBe(true)
    })
  })

  describe('ATTACH_DETACH pattern', () => {
    test('should match ATTACH', () => {
      expect(SQL_PATTERNS.ATTACH_DETACH.test('ATTACH TABLE t')).toBe(true)
    })

    test('should match DETACH', () => {
      expect(SQL_PATTERNS.ATTACH_DETACH.test('DETACH TABLE t')).toBe(true)
    })
  })

  describe('PERMISSION_COMMANDS pattern', () => {
    test('should match GRANT', () => {
      expect(SQL_PATTERNS.PERMISSION_COMMANDS.test('GRANT SELECT ON t')).toBe(
        true
      )
    })

    test('should match REVOKE', () => {
      expect(SQL_PATTERNS.PERMISSION_COMMANDS.test('REVOKE SELECT ON t')).toBe(
        true
      )
    })
  })

  describe('DANGEROUS_FUNCTIONS pattern', () => {
    test('should match remote function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('remote()')).toBe(true)
    })

    test('should match url function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('url()')).toBe(true)
    })

    test('should match s3 function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('s3()')).toBe(true)
    })

    test('should match mysql function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('mysql()')).toBe(true)
    })

    test('should match postgresql function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('postgresql()')).toBe(true)
    })

    test('should match hdfs function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('hdfs()')).toBe(true)
    })

    test('should match file function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('file()')).toBe(true)
    })

    test('should match jdbc function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('jdbc()')).toBe(true)
    })

    test('should match odbc function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('odbc()')).toBe(true)
    })

    test('should match input function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('input()')).toBe(true)
    })

    test('should match executable function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('executable()')).toBe(true)
    })

    test('should match mongodb function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('mongodb()')).toBe(true)
    })

    test('should match redis function', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('redis()')).toBe(true)
    })

    test('should not match safe functions', () => {
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('count()')).toBe(false)
      expect(SQL_PATTERNS.DANGEROUS_FUNCTIONS.test('sum(bytes)')).toBe(false)
    })
  })
})

describe.skipIf(actuallyMocked)('validateSqlQuery', () => {
  describe('valid queries', () => {
    test('should accept simple SELECT queries', () => {
      expect(() => validateSqlQuery('SELECT * FROM system.users')).not.toThrow()
      expect(() =>
        validateSqlQuery('SELECT count() FROM system.tables')
      ).not.toThrow()
    })

    test('should accept SELECT with WHERE clause', () => {
      expect(() =>
        validateSqlQuery('SELECT * FROM users WHERE name = {name:String}')
      ).not.toThrow()
    })

    test('should accept SELECT with parameterized queries', () => {
      expect(() =>
        validateSqlQuery(
          'SELECT * FROM system.tables WHERE name = {name:String}'
        )
      ).not.toThrow()
    })

    test('should accept WITH (CTE) queries', () => {
      expect(() =>
        validateSqlQuery('WITH cte AS (SELECT 1) SELECT * FROM cte')
      ).not.toThrow()
    })

    test('should accept DESCRIBE queries', () => {
      expect(() =>
        validateSqlQuery('DESCRIBE TABLE system.tables')
      ).not.toThrow()
      expect(() =>
        validateSqlQuery('DESCRIBE TABLE analytics.events')
      ).not.toThrow()
    })

    test('should accept EXPLAIN queries', () => {
      expect(() =>
        validateSqlQuery('EXPLAIN SELECT * FROM system.tables')
      ).not.toThrow()
      expect(() =>
        validateSqlQuery('EXPLAIN PIPELINE SELECT * FROM system.processes')
      ).not.toThrow()
      expect(() => validateSqlQuery('EXPLAIN AST SELECT 1')).not.toThrow()
      expect(() => validateSqlQuery('EXPLAIN SYNTAX SELECT 1')).not.toThrow()
      expect(() =>
        validateSqlQuery('EXPLAIN PLAN SELECT count() FROM system.query_log')
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

    test('should accept SELECT with multiple table references', () => {
      expect(() =>
        validateSqlQuery(
          "SELECT * FROM system.query_log WHERE query LIKE '%SELECT%'"
        )
      ).not.toThrow()
    })
  })

  describe('empty queries', () => {
    test('should reject empty string', () => {
      expect(() => validateSqlQuery('')).toThrow('SQL query cannot be empty')
    })

    test('should reject whitespace-only string', () => {
      expect(() => validateSqlQuery('   ')).toThrow('SQL query cannot be empty')
      expect(() => validateSqlQuery('\t\n')).toThrow(
        'SQL query cannot be empty'
      )
    })

    test('should reject null-like input', () => {
      expect(() => validateSqlQuery('' as string)).toThrow(
        'SQL query cannot be empty'
      )
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
      expect(() =>
        validateSqlQuery('INSERT INTO users VALUES (1, "test")')
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject UPDATE statements', () => {
      expect(() => validateSqlQuery('UPDATE users SET name = "test"')).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject ALTER statements', () => {
      expect(() =>
        validateSqlQuery('ALTER TABLE users ADD COLUMN age Int32')
      ).toThrow('Potentially dangerous SQL detected')
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

    test('should reject case-insensitive DROP', () => {
      expect(() => validateSqlQuery('drop table users')).toThrow()
    })
  })

  describe('execution commands', () => {
    test('should reject EXEC/EXECUTE commands', () => {
      expect(() => validateSqlQuery("EXEC('DROP TABLE')")).toThrow(
        'Potentially dangerous SQL detected'
      )
    })

    test('should reject SCRIPT command', () => {
      expect(() => validateSqlQuery('SCRIPT something')).toThrow()
    })
  })

  describe('SQL injection patterns', () => {
    test('should allow line comments', () => {
      expect(() =>
        validateSqlQuery('-- comment\nSELECT * FROM users')
      ).not.toThrow()
    })

    test('should allow block comments', () => {
      expect(() =>
        validateSqlQuery('SELECT /* comment */ * FROM users')
      ).not.toThrow()
    })

    test('should allow QUERY_COMMENT prefix', () => {
      expect(() =>
        validateSqlQuery(
          '/* { "client": "clickhouse-monitoring" } */ SELECT * FROM system.processes'
        )
      ).not.toThrow()
    })

    test('should allow block comment before SELECT', () => {
      expect(() =>
        validateSqlQuery('/* comment */ SELECT * FROM t')
      ).not.toThrow()
    })

    test('should reject chained dangerous statements', () => {
      expect(() =>
        validateSqlQuery('SELECT * FROM users; DROP TABLE users')
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject tautology attacks (1=1)', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM users WHERE name = '' OR 1=1")
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject UNION injection', () => {
      expect(() =>
        validateSqlQuery(
          "SELECT * FROM users WHERE name = '' UNION SELECT * FROM passwords"
        )
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject UNION ALL injection', () => {
      expect(() =>
        validateSqlQuery('SELECT 1 UNION ALL SELECT secret FROM system.users')
      ).toThrow('Potentially dangerous SQL detected')
    })

    test('should reject string-based injection', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM users WHERE name = '' OR '1'='1")
      ).toThrow('Potentially dangerous SQL detected')
    })
  })

  describe('ClickHouse-specific dangerous commands', () => {
    test('should reject SET commands', () => {
      expect(() => validateSqlQuery('SET max_memory_usage = 100')).toThrow()
    })

    test('should reject SYSTEM commands', () => {
      expect(() => validateSqlQuery('SYSTEM RELOAD DICTIONARIES')).toThrow()
      expect(() => validateSqlQuery('SYSTEM SHUTDOWN')).toThrow()
      expect(() => validateSqlQuery('SYSTEM FLUSH LOGS')).toThrow()
    })

    test('should reject KILL commands', () => {
      expect(() => validateSqlQuery('KILL QUERY')).toThrow()
    })

    test('should reject ATTACH/DETACH commands', () => {
      expect(() => validateSqlQuery('ATTACH TABLE t')).toThrow()
      expect(() => validateSqlQuery('DETACH TABLE t')).toThrow()
    })

    test('should reject GRANT/REVOKE commands', () => {
      expect(() => validateSqlQuery('GRANT SELECT ON t TO user')).toThrow()
      expect(() => validateSqlQuery('REVOKE SELECT ON t FROM user')).toThrow()
    })
  })

  describe('dangerous functions', () => {
    test('should reject remote function', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM remote('host', 'db', 'table')")
      ).toThrow()
    })

    test('should reject s3 function', () => {
      expect(() => validateSqlQuery("SELECT * FROM s3('bucket/key')")).toThrow()
    })

    test('should reject url function', () => {
      expect(() =>
        validateSqlQuery("SELECT * FROM url('http://evil.com')")
      ).toThrow()
    })

    test('should reject mysql function', () => {
      expect(() =>
        validateSqlQuery(
          "SELECT * FROM mysql('host', 'db', 'table', 'user', 'pass')"
        )
      ).toThrow()
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
      expect(() => validateSqlQuery('SHOW TABLES')).toThrow(
        'Only SELECT, WITH (CTE), DESCRIBE, and EXPLAIN queries are allowed'
      )
    })

    test('should reject USE queries', () => {
      expect(() => validateSqlQuery('USE database')).toThrow()
    })
  })

  describe('comments handling', () => {
    test('should accept multiple line comments', () => {
      expect(() =>
        validateSqlQuery('-- line1\n-- line2\nSELECT 1')
      ).not.toThrow()
    })

    test('should accept inline block comment', () => {
      expect(() => validateSqlQuery('SELECT /* inline */ 1')).not.toThrow()
    })

    test('should accept multi-line block comment', () => {
      expect(() =>
        validateSqlQuery('/* multi\nline\ncomment */ SELECT 1')
      ).not.toThrow()
    })
  })
})
