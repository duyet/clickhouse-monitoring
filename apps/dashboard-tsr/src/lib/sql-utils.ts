/**
 * @fileoverview SQL utilities for safely handling ClickHouse queries
 * Provides functions to prevent SQL injection when building dynamic queries
 */

/**
 * Validates and sanitizes a ClickHouse identifier (database, table, column, cluster name)
 *
 * ClickHouse identifiers can contain:
 * - Letters (a-z, A-Z)
 * - Numbers (0-9)
 * - Underscores (_)
 * - Hyphens (-)
 * - Dots (.) for qualified names like database.table
 *
 * @param identifier - The identifier to validate
 * @param allowDots - Whether to allow dots in the identifier (default: false)
 * @returns The validated identifier
 * @throws Error if the identifier contains invalid characters
 */
export function validateIdentifier(
  identifier: string,
  allowDots: boolean = false
): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Identifier must be a non-empty string')
  }

  const pattern = allowDots ? /^[a-zA-Z0-9_.-]+$/ : /^[a-zA-Z0-9_-]+$/

  if (!pattern.test(identifier)) {
    throw new Error(
      `Invalid identifier: "${identifier}". Only alphanumeric characters, underscores, and hyphens${allowDots ? ', and dots' : ''} are allowed.`
    )
  }

  return identifier
}

/**
 * Escapes a ClickHouse identifier using backticks
 * This is the safest way to handle identifiers that might contain special characters
 *
 * @param identifier - The identifier to escape
 * @returns The escaped identifier wrapped in backticks
 */
export function escapeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Identifier must be a non-empty string')
  }

  // Escape backticks by doubling them
  const escaped = identifier.replace(/`/g, '``')

  return `\`${escaped}\``
}

/**
 * Escapes a qualified identifier (e.g., database.table)
 *
 * @param parts - The parts of the qualified identifier
 * @returns The escaped qualified identifier
 */
export function escapeQualifiedIdentifier(...parts: string[]): string {
  return parts.map(escapeIdentifier).join('.')
}

/**
 * Validates and formats a LIMIT value
 *
 * @param limit - The limit value to validate
 * @returns The validated limit as a number
 * @throws Error if the limit is invalid
 */
export function validateLimit(limit: number | string): number {
  const numLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit

  if (Number.isNaN(numLimit) || numLimit < 0 || !Number.isInteger(numLimit)) {
    throw new Error(`Invalid LIMIT value: ${limit}`)
  }

  // Reasonable maximum to prevent abuse
  if (numLimit > 100000) {
    throw new Error(`LIMIT value too large: ${limit}. Maximum is 100000.`)
  }

  return numLimit
}

/**
 * Removes a trailing `FORMAT <Name>` clause (and any trailing semicolon) from a
 * query.
 *
 * Queries read back from `system.query_log` were issued by the dashboard with an
 * output format appended (e.g. `FORMAT JSONEachRow`). When such a query is
 * loaded into the SQL console editor that clause is noise — the console picks
 * its own format — and re-running it with a hard-coded `FORMAT` can break the
 * result parser. The `FORMAT` clause is only valid as the final element of a
 * ClickHouse query, so stripping the trailing occurrence is safe.
 *
 * @param sql - The query text to clean
 * @returns The query with any trailing FORMAT clause and semicolon removed
 */
export function stripTrailingFormat(sql: string): string {
  if (!sql) return sql
  return sql
    .replace(/;\s*$/, '')
    .replace(/\s+FORMAT\s+[A-Za-z0-9_]+\s*;?\s*$/i, '')
    .trimEnd()
}
