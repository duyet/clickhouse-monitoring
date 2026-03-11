/**
 * Query execution tools - LangGraph agent tools for SQL operations.
 *
 * These tools enable LLMs to execute queries and preview data:
 * - execute_sql: Execute SELECT query with validation
 * - sample_table: Get sample rows from a table
 *
 * Export for use in the central tool registry.
 */

import { executeSqlTool } from './execute-sql'
import { sampleTableTool } from './sample-table'

export { executeSqlTool, sampleTableTool }

/**
 * All query tools for convenient binding to LLM
 */
export const queryTools = [executeSqlTool, sampleTableTool] as const
