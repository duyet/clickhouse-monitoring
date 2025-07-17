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

export function parseTableName(fullTableName: string): {
  database: string
  table: string
} {
  const parts = fullTableName.split('.')
  if (parts.length !== 2) {
    throw new Error(
      `Invalid table name format: ${fullTableName}. Expected format: database.table`
    )
  }
  return { database: parts[0], table: parts[1] }
}

export async function validateTableExistence(
  queryConfig: QueryConfig,
  hostId: number
): Promise<TableValidationResult> {
  try {
    const tablesToCheck: string[] = []

    // If tableCheck is explicitly provided, use it
    if (queryConfig.tableCheck) {
      if (Array.isArray(queryConfig.tableCheck)) {
        tablesToCheck.push(...queryConfig.tableCheck)
      } else {
        tablesToCheck.push(queryConfig.tableCheck)
      }
    }

    if (tablesToCheck.length === 0) {
      return { shouldProceed: true, missingTables: [] }
    }

    const missingTables: string[] = []

    for (const fullTableName of tablesToCheck) {
      let database: string
      let table: string
      try {
        const { database: parsedDatabase, table: parsedTable } =
          parseTableName(fullTableName)
        database = parsedDatabase
        table = parsedTable
      } catch (error) {
        console.error(`Error parsing table name: ${fullTableName}`, error)
        missingTables.push(fullTableName)
        continue
      }

      const exists = await tableExistenceCache.checkTableExists(
        hostId,
        database,
        table
      )
      if (!exists) {
        missingTables.push(fullTableName)
      }
    }

    return {
      shouldProceed: missingTables.length === 0,
      missingTables,
    }
  } catch (error) {
    console.error('Error validating table existence:', error)
    return {
      shouldProceed: false,
      missingTables: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
