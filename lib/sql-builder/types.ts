/**
 * SQL Builder Type Definitions
 *
 * Core types for the immutable SQL query builder.
 */

/**
 * Base interface for SQL fragments that can be converted to SQL strings
 */
export interface SqlFragment {
  toSql(): string
}

/**
 * Window function options for OVER clause
 */
export interface WindowOptions {
  partitionBy?: string | string[]
  orderBy?: string
}

/**
 * Valid SQL expression types
 */
export type SqlExpression = string | SqlFragment

/**
 * Valid SQL value types
 */
export type SqlValue = string | number | boolean | null | SqlExpression

/**
 * SQL condition for WHERE and HAVING clauses
 */
export interface SqlCondition {
  column: string
  operator: string
  value: SqlValue
  type: 'and' | 'or'
}

/**
 * Grouped WHERE/HAVING conditions
 */
export interface WhereGroup {
  conditions: (SqlCondition | WhereGroup)[]
  type: 'and' | 'or'
}

/**
 * SQL JOIN types supported by ClickHouse
 */
export type JoinType =
  | 'INNER'
  | 'LEFT'
  | 'RIGHT'
  | 'FULL'
  | 'CROSS'
  | 'ARRAY'
  | 'INNER ANY'
  | 'LEFT ANY'
  | 'INNER ALL'
  | 'LEFT ALL'

/**
 * Forward declaration for SqlBuilder to avoid circular dependency
 */
export interface SqlBuilderLike {
  readonly state: BuilderState
  build(): string
  buildPretty(): string
}

/**
 * SQL JOIN clause
 */
export interface SqlJoin {
  type: JoinType
  table: string | SqlBuilderLike
  alias?: string
  condition?: string
  using?: string[]
}

/**
 * Common Table Expression (CTE)
 */
export interface SqlCte {
  name: string
  query: SqlBuilderLike
}

/**
 * ORDER BY clause
 */
export interface SqlOrder {
  column: string | SqlFragment
  direction: 'ASC' | 'DESC'
  nulls?: 'FIRST' | 'LAST'
}

/**
 * Internal builder state (immutable)
 */
export interface BuilderState {
  ctes: SqlCte[]
  columns: SqlExpression[]
  from?: { table: string | SqlBuilderLike; alias?: string }
  joins: SqlJoin[]
  wheres: (SqlCondition | WhereGroup)[]
  groupBy: string[]
  having: (SqlCondition | WhereGroup)[]
  orderBy: SqlOrder[]
  limit?: number
  offset?: number
  unions: { query: SqlBuilderLike; all: boolean }[]
  settings: Record<string, unknown>
  format?: string
}
