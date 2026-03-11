/**
 * Schema exploration tools - LangGraph agent tools for database discovery.
 *
 * These tools enable LLMs to explore ClickHouse database structure:
 * - list_databases: Discover all databases
 * - list_tables: List tables in a database
 * - get_table_schema: Get column definitions for a table
 * - search_tables: Search tables by pattern
 *
 * Export for use in the central tool registry.
 */

import { getTableSchemaTool } from './get-table-schema'
import { listDatabasesTool } from './list-databases'
import { listTablesTool } from './list-tables'
import { searchTablesTool } from './search-tables'

export {
  listDatabasesTool,
  listTablesTool,
  getTableSchemaTool,
  searchTablesTool,
}

/**
 * All schema tools for convenient binding to LLM
 */
export const schemaTools = [
  listDatabasesTool,
  listTablesTool,
  getTableSchemaTool,
  searchTablesTool,
] as const
