/**
 * Table Validator
 *
 * This module provides table existence validation for optional queries.
 *
 * It solves the issue where queries fail when trying to access tables that don't exist
 * (e.g., system.backup_log, system.error_log, system.zookeeper).
 *
 * Features:
 * - Caches table existence checks to avoid repeated queries
 * - Supports explicit table checking via QueryConfig.tableCheck
 * - Automatically extracts table names from SQL if not specified
 * - Gracefully handles missing tables for optional queries
 *
 * Usage:
 * 1. Mark QueryConfig with `optional: true`
 * 2. Optionally specify `tableCheck: "system.backup_log"`
 * 3. Use `fetchData` with `queryConfig` parameter
 *
 * @see https://github.com/duyet/clickhouse-monitoring/issues/510
 */

import { tableExistenceCache } from '@/lib/table-existence-cache'
import { type QueryConfig } from '@/types/query-config'

export type TableValidationResult = {
  shouldProceed: boolean
  missingTables: string[]
  error?: string
}

export function parseTableFromSQL(sql: string): string[] {
  const tables: string[] = []

  // Match patterns like "FROM system.backup_log", "JOIN system.error_log", "FROM system.tables"
  // This regex looks for FROM or JOIN followed by table names in database.table format
  const tableMatches = sql.match(/(?:FROM|JOIN)\s+(\w+\.\w+)/gi)
  if (tableMatches) {
    tableMatches.forEach((match) => {
      const table = match.replace(/(?:FROM|JOIN)\s+/i, '').trim()
      if (table && !tables.includes(table)) {
        tables.push(table)
      }
    })
  }

  return tables
}


export async function validateTableExistence(
  queryConfig: QueryConfig,
  hostId: number
): Promise<TableValidationResult> {
  // Force into string[] and add SQL parsing fallback
  const tablesToCheck = ([] as string[]).concat(
    queryConfig.tableCheck ?? 
    (queryConfig.sql ? parseTableFromSQL(queryConfig.sql) : [])
  )
  
  if (tablesToCheck.length === 0) {
    return { shouldProceed: true, missingTables: [] }
  }

  // Check all tables in parallel
  const missingTables = (
    await Promise.all(
      tablesToCheck.map(async (fullName) => {
        const [db, tbl] = fullName.split('.')
        if (!db || !tbl) return fullName // malformed name
        const exists = await tableExistenceCache.checkTableExists(hostId, db, tbl)
        return exists ? null : fullName
      })
    )
  ).filter(Boolean) as string[]

  return {
    shouldProceed: missingTables.length === 0,
    missingTables,
  }
}
