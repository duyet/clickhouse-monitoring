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
 * The validator only allows SELECT queries and WITH (CTE) clauses.
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
} as const

/**
 * Array of all SQL injection patterns for iteration
 *
 * @internal
 */
const SQL_INJECTION_PATTERNS = [
  SQL_PATTERNS.DANGEROUS_KEYWORDS,
  SQL_PATTERNS.EXECUTION_COMMANDS,
  SQL_PATTERNS.LINE_COMMENT,
  SQL_PATTERNS.BLOCK_COMMENT_START,
  SQL_PATTERNS.BLOCK_COMMENT_END,
  SQL_PATTERNS.CHAINED_DANGEROUS,
  SQL_PATTERNS.STRING_INJECTION_SINGLE,
  SQL_PATTERNS.STRING_INJECTION_OR_SINGLE,
  SQL_PATTERNS.STRING_INJECTION_DOUBLE,
  SQL_PATTERNS.TAUTOLOGY,
  SQL_PATTERNS.UNION_INJECTION,
]

/**
 * Validate SQL query for basic safety and correctness
 *
 * Detects common SQL injection patterns and ensures the query is non-empty.
 * Only SELECT queries and WITH (CTE) clauses are allowed.
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
        'Potentially dangerous SQL detected. Only SELECT queries are allowed.'
      )
    }
  }

  // Ensure query starts with SELECT or WITH (CTE)
  const trimmed = sql.trim().toUpperCase()
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    throw new Error('Only SELECT queries are allowed')
  }
}
