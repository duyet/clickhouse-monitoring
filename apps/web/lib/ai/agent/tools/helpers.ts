/**
 * Shared helpers for agent tool implementations.
 *
 * Provides common query execution patterns to eliminate boilerplate
 * across tool category files.
 */

import 'server-only'

import type { DataFormat } from '@clickhouse/client'

import { fetchData } from '@chm/clickhouse-client'
import { validateSqlQuery } from '@chm/sql-builder'
import { z } from 'zod/v3'

/**
 * Resolve the effective host ID from tool input and default.
 */
export function resolveHostId(
  toolHostId: number | undefined,
  defaultHostId: number
): number {
  return toolHostId ?? defaultHostId
}

/**
 * Execute a read-only query against ClickHouse.
 * Validates SQL, sets readonly mode, and returns data or throws.
 */
export async function readOnlyQuery(options: {
  query: string
  hostId: number
  format?: DataFormat
  query_params?: Record<string, unknown>
}): Promise<unknown> {
  const { query, hostId, format = 'JSONEachRow', query_params } = options

  const result = await fetchData({
    query,
    hostId,
    format,
    query_params,
    clickhouse_settings: { readonly: '1' },
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data
}

/**
 * Execute a validated read-only SQL query (user-provided SQL).
 * Runs SQL validation before execution.
 */
export async function validatedReadOnlyQuery(options: {
  sql: string
  hostId: number
  format?: DataFormat
}): Promise<unknown> {
  const { sql, hostId, format = 'JSONEachRow' } = options

  try {
    validateSqlQuery(sql)
  } catch (err) {
    throw new Error(
      `Validation error: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  return readOnlyQuery({ query: sql, hostId, format })
}

/**
 * Execute a write query (KILL, OPTIMIZE, etc.) against ClickHouse.
 * No readonly setting. Use only for control actions.
 */
export async function writeQuery(options: {
  query: string
  hostId: number
  query_params?: Record<string, unknown>
}): Promise<unknown> {
  const { query, hostId, query_params } = options

  const result = await fetchData({
    query,
    hostId,
    query_params,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data
}

/**
 * Valid SQL identifier pattern for table names.
 * Reused from actions route for consistent validation.
 */
const VALID_TABLE_IDENTIFIER =
  /^(`[^`]+`|[a-zA-Z_][a-zA-Z0-9_]*)(\.\s*(`[^`]+`|[a-zA-Z_][a-zA-Z0-9_]*))?$/

/**
 * Validate table identifier to prevent SQL injection.
 */
export function isValidTableIdentifier(table: string): boolean {
  if (!table || table.length > 256) return false
  return VALID_TABLE_IDENTIFIER.test(table.trim())
}

/**
 * Standardized schema for ClickHouse host ID overriding.
 * Preprocesses null, empty string, and whitespace-only strings into undefined
 * to prevent silent coercion to host 0, while coercing integer values safely.
 */
export const hostIdSchema = z
  .preprocess((val) => {
    if (val === null || val === undefined) return undefined
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.coerce.number().int().nonnegative().optional())
  .describe('Override host ID')

/**
 * Standardized schema for required ClickHouse host IDs.
 * Preprocesses null, empty string, and whitespace-only strings into undefined
 * to trigger validation failures instead of silent coercion to host 0.
 */
export const requiredHostIdSchema = z.preprocess((val) => {
  if (val === null || val === undefined) return undefined
  if (typeof val === 'string' && val.trim() === '') return undefined
  return val
}, z.coerce.number().int().nonnegative())
