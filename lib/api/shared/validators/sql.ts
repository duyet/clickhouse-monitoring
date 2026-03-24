/**
 * SQL Validators
 *
 * Validation utilities for SQL queries to prevent injection attacks.
 *
 * @module lib/api/shared/validators/sql
 */

/**
 * SQL injection patterns to detect and prevent
 *
 * These patterns are used to identify potentially dangerous SQL operations.
 * The validator allows SELECT queries, WITH (CTE) clauses, DESCRIBE, and EXPLAIN commands.
 *
 * @constant
 * @readonly
 */
export const SQL_PATTERNS = {
  /**
   * Dangerous SQL keywords that modify data or schema
   */
  DANGEROUS_KEYWORDS: /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i,

  /**
   * SQL execution commands
   */
  EXECUTION_COMMANDS: /\b(EXEC|EXECUTE|SCRIPT)\b/i,

  /**
   * SQL comment patterns that can hide malicious code
   */
  LINE_COMMENT: /--(\s|$)/,
  BLOCK_COMMENT_START: /\/\*/,
  BLOCK_COMMENT_END: /\*\//,

  /**
   * Chained dangerous statements
   */
  CHAINED_DANGEROUS: /;\s*(DROP|DELETE|INSERT|UPDATE)/i,

  /**
   * SQL injection via string manipulation
   */
  STRING_INJECTION_SINGLE: /';.*--/,
  STRING_INJECTION_DOUBLE: /".*OR.*".*=.*"/i,
  STRING_INJECTION_OR_SINGLE: /'.*OR.*'.*=.*'/i,

  /**
   * Tautology attacks (always true conditions)
   */
  TAUTOLOGY: /\bor\s+1\s*=\s*1\b/i,

  /**
   * UNION-based injection attacks
   */
  UNION_INJECTION: /\bunion\s+select\b/i,

  /** ClickHouse SET commands that modify server behavior */
  SET_COMMAND: /\bSET\b/i,

  /** ClickHouse SYSTEM commands (RELOAD, SHUTDOWN, etc.) - not system.table references */
  SYSTEM_COMMAND:
    /\bSYSTEM\s+(RELOAD|SHUTDOWN|KILL|FLUSH|SYNC|START|STOP|DROP)\b/i,

  /** KILL queries that terminate running operations */
  KILL_COMMAND: /\bKILL\b/i,

  /** ATTACH/DETACH operations on tables and databases */
  ATTACH_DETACH: /\b(ATTACH|DETACH)\b/i,

  /** GRANT/REVOKE permission operations */
  PERMISSION_COMMANDS: /\b(GRANT|REVOKE)\b/i,

  /** Dangerous ClickHouse table functions that access external resources */
  DANGEROUS_FUNCTIONS:
    /\b(remote|remoteSecure|url|s3|hdfs|input|jdbc|odbc|mysql|postgresql)\s*\(/i,
} as const

/**
 * Array of all SQL injection patterns for iteration
 *
 * @internal
 */
const SQL_INJECTION_PATTERNS = [
  SQL_PATTERNS.DANGEROUS_KEYWORDS,
  SQL_PATTERNS.EXECUTION_COMMANDS,
  SQL_PATTERNS.CHAINED_DANGEROUS,
  SQL_PATTERNS.STRING_INJECTION_SINGLE,
  SQL_PATTERNS.STRING_INJECTION_OR_SINGLE,
  SQL_PATTERNS.STRING_INJECTION_DOUBLE,
  SQL_PATTERNS.TAUTOLOGY,
  SQL_PATTERNS.UNION_INJECTION,
  SQL_PATTERNS.SET_COMMAND,
  SQL_PATTERNS.SYSTEM_COMMAND,
  SQL_PATTERNS.KILL_COMMAND,
  SQL_PATTERNS.ATTACH_DETACH,
  SQL_PATTERNS.PERMISSION_COMMANDS,
  SQL_PATTERNS.DANGEROUS_FUNCTIONS,
]

/**
 * Validate SQL query for basic safety and correctness
 *
 * Detects common SQL injection patterns and ensures the query is non-empty.
 * Only SELECT queries, WITH (CTE) clauses, DESCRIBE, and EXPLAIN commands are allowed.
 *
 * @param sql - The SQL query string to validate
 * @throws {Error} If the query contains suspicious patterns or is invalid
 *
 * @example
 * ```ts
 * // Valid queries
 * validateSqlQuery('SELECT * FROM system.users')
 * validateSqlQuery('SELECT count() FROM system.tables WHERE name = {name:String}')
 * validateSqlQuery('WITH cte AS (SELECT 1) SELECT * FROM cte')
 * validateSqlQuery('DESCRIBE TABLE system.tables')
 * validateSqlQuery('EXPLAIN PIPELINE SELECT 1')
 * validateSqlQuery('EXPLAIN AST SELECT 1')
 *
 * // Invalid queries - throws errors
 * validateSqlQuery('') // Throws: "SQL query cannot be empty"
 * validateSqlQuery('   ') // Throws: "SQL query cannot be empty"
 * validateSqlQuery('DROP TABLE users') // Throws: "Potentially dangerous SQL detected"
 * validateSqlQuery("SELECT * FROM users WHERE name = '' OR 1=1 --'") // Throws
 * ```
 */
export function validateSqlQuery(sql: string): void {
  // Check for empty query
  if (!sql || sql.trim().length === 0) {
    throw new Error('SQL query cannot be empty')
  }

  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(
        'Potentially dangerous SQL detected. Only SELECT, WITH, DESCRIBE, and EXPLAIN queries are allowed.'
      )
    }
  }

  // Strip leading comments before checking the statement type
  const trimmed = sql
    .trim()
    .replace(/^(\/\*[\s\S]*?\*\/\s*|--[^\n]*\n\s*)*/g, '')
    .trimStart()
    .toUpperCase()
  if (
    !trimmed.startsWith('SELECT') &&
    !trimmed.startsWith('WITH') &&
    !trimmed.startsWith('DESCRIBE') &&
    !trimmed.startsWith('EXPLAIN')
  ) {
    throw new Error(
      'Only SELECT, WITH (CTE), DESCRIBE, and EXPLAIN queries are allowed'
    )
  }
}
