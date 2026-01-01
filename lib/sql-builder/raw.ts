/**
 * Raw SQL Utilities
 *
 * Escape hatches for raw SQL expressions and parameter helpers.
 */

import type { SqlFragment } from './types'

/**
 * Raw SQL expression (escape hatch)
 *
 * Use when you need to inject arbitrary SQL that the builder doesn't support.
 * The SQL is used as-is without any processing or validation.
 *
 * @example
 * ```typescript
 * raw('x + y * 2').as('calculated')
 * // → "(x + y * 2) AS calculated"
 *
 * raw('CASE WHEN x > 0 THEN 1 ELSE 0 END').as('flag')
 * // → "(CASE WHEN x > 0 THEN 1 ELSE 0 END) AS flag"
 * ```
 */
export class RawSql implements SqlFragment {
  private sql: string
  private _alias?: string

  constructor(sql: string) {
    this.sql = sql
  }

  /**
   * Set an alias for the raw SQL expression
   *
   * @param alias - Alias name
   * @returns New RawSql instance
   *
   * @example
   * ```typescript
   * raw('x + y').as('sum')
   * // → "(x + y) AS sum"
   * ```
   */
  as(alias: string): RawSql {
    const instance = new RawSql(this.sql)
    instance._alias = alias
    return instance
  }

  /**
   * Convert to SQL string
   *
   * Wraps the raw SQL in parentheses if it has an alias.
   *
   * @returns SQL expression
   */
  toSql(): string {
    if (this._alias) {
      return `(${this.sql}) AS ${this._alias}`
    }
    return this.sql
  }
}

/**
 * Create a raw SQL expression
 *
 * @param sql - Raw SQL string
 * @returns RawSql instance
 *
 * @example
 * ```typescript
 * raw('x + y * 2')
 * raw('CASE WHEN active THEN 1 ELSE 0 END').as('active_flag')
 * ```
 */
export function raw(sql: string): RawSql {
  return new RawSql(sql)
}

/**
 * Create a ClickHouse query parameter placeholder
 *
 * Generates `{name:Type}` format for ClickHouse parameterized queries.
 *
 * @param name - Parameter name
 * @param type - ClickHouse type (e.g., 'String', 'UInt32', 'DateTime')
 * @returns Parameter placeholder string
 *
 * @example
 * ```typescript
 * param('user', 'String')
 * // → "{user:String}"
 *
 * param('limit', 'UInt32')
 * // → "{limit:UInt32}"
 *
 * param('start_date', 'DateTime')
 * // → "{start_date:DateTime}"
 * ```
 */
export function param(name: string, type: string): string {
  return `{${name}:${type}}`
}
