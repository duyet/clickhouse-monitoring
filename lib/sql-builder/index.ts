/**
 * SQL Builder
 *
 * Fluent API for building ClickHouse SQL queries with type safety.
 *
 * @example
 * ```typescript
 * import { sql, col, fn, raw, param } from '@/lib/sql-builder'
 *
 * // Basic query
 * const query = sql()
 *   .select('id', 'name', 'email')
 *   .from('users')
 *   .where('status', '=', 'active')
 *   .orderBy('created_at', 'DESC')
 *   .limit(10)
 *   .build()
 *
 * // Column helpers
 * col('bytes').readable()
 * col('elapsed').pctOfMax()
 *
 * // Function helpers
 * fn.readableSize('bytes')
 * fn.pctOfMax('elapsed', 2)
 *
 * // Raw SQL
 * raw('x + y * 2').as('calculated')
 *
 * // Parameters
 * param('user', 'String')
 * ```
 */

export { SqlBuilder, sql } from './builder'
export { ColumnBuilder, col } from './column'
export { ExtendedBuilder } from './extension'
export { fn } from './functions'
export { param, RawSql, raw } from './raw'
export * from './types'
export { SqlBuilderError, validateBuilderState } from './validator'
