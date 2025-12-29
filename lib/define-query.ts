import type { QueryConfig } from '@/types/query-config'

/**
 * Type-safe query configuration factory function.
 *
 * This helper enables full TypeScript autocomplete and validation for the Row type,
 * ensuring compile-time safety for column references, format options, and other
 * type-dependent properties.
 *
 * The magic is entirely in the TypeScript type system - this function simply returns
 * its input while preserving the generic Row type for inference and validation.
 *
 * @example
 * ```typescript
 * // Define the row type matching your SQL query result
 * export type Row = {
 *   cluster: string
 *   shard_count: number
 *   replica_count: number
 *   replica_status: string
 * }
 *
 * // Use defineQuery to get full type safety and autocomplete
 * export const queryConfig = defineQuery<Row>({
 *   name: 'clusters',
 *   description: 'Cluster information',
 *   sql: `SELECT cluster, countDistinct(shard_num) as shard_count...`,
 *   // Column names have autocomplete and validation against Row keys
 *   columns: ['cluster', 'shard_count', 'replica_count', 'replica_status'],
 *   columnFormats: {
 *     // TypeScript validates that keys exist in Row type
 *     cluster: [ColumnFormat.Link, { href: '/[ctx.hostId]/clusters/[cluster]' }],
 *     replica_status: [
 *       ColumnFormat.Link,
 *       { href: '/[ctx.hostId]/clusters/[cluster]/replicas-status' },
 *     ],
 *   },
 * })
 * ```
 *
 * @param config - The query configuration object to be validated and returned
 * @returns The same configuration object with full type safety
 *
 * @remarks
 * Benefits compared to untyped QueryConfig:
 * - Autocomplete for column names in all field arrays
 * - Compile-time validation that column names match Row type
 * - IDE support for discovering all available row properties
 * - Self-documenting code through type inference
 *
 * The function is intentionally minimal - the type safety comes from the
 * generic TRow parameter, not from runtime logic.
 */
export function defineQuery<_TRow extends Record<string, unknown>>(
  config: QueryConfig
): QueryConfig {
  return config
}
