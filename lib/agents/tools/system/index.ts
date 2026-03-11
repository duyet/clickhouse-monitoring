/**
 * System metrics tools - LangGraph agent tools for server monitoring.
 *
 * These tools enable LLMs to monitor ClickHouse server health:
 * - get_metrics: Server metrics (version, uptime, connections, memory)
 * - get_running_queries: Currently executing queries
 * - get_merge_status: Active merge operations
 *
 * Export for use in the central tool registry.
 */

import { getMergeStatusTool } from './get-merge-status'
import { getMetricsTool } from './get-metrics'
import { getRunningQueriesTool } from './get-running-queries'

export { getMetricsTool, getRunningQueriesTool, getMergeStatusTool }

/**
 * All system tools for convenient binding to LLM
 */
export const systemTools = [
  getMetricsTool,
  getRunningQueriesTool,
  getMergeStatusTool,
] as const
