/**
 * Chart data tools - LangGraph agent tools for chart visualization.
 *
 * These tools enable LLMs to fetch pre-configured chart data:
 * - list_charts: Discover all available charts
 * - get_chart_data: Get data for a specific chart
 *
 * Export for use in the central tool registry.
 */

import { getChartDataTool } from './get-chart-data'
import { listChartsTool } from './list-charts'

export { listChartsTool, getChartDataTool }

/**
 * All chart tools for convenient binding to LLM
 */
export const chartTools = [listChartsTool, getChartDataTool] as const
