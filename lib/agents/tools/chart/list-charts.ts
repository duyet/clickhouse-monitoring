/**
 * LangGraph tool: List all available charts.
 *
 * This tool enables LLMs to discover pre-configured charts that can be
 * used for visualizing ClickHouse data.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { getAvailableCharts } from '@/lib/api/chart-registry'

/**
 * List all available charts
 *
 * Returns a list of chart names that the LLM can use to fetch
 * pre-configured chart data via get_chart_data.
 */
export const listChartsTool = tool(
  async () => {
    const charts = getAvailableCharts()

    return {
      charts,
      count: charts.length,
    }
  },
  {
    name: 'list_charts',
    description: `List all available pre-configured monitoring charts.

**Use this tool when user asks about:**
- "What charts are available?", "show available charts"
- "What metrics can I visualize?", "available monitoring"
- Before using get_chart_data to discover chart names

**Returns:** Array of chart names (e.g., ["query-count", "top-tables-size", "merge-operations"])

**Example:** list_charts() → { charts: ["query-count", "top-tables-size", "merge-operations", "cpu-usage"], count: 32 }

**Next step:** Use get_chart_data with a specific chart name to fetch the data.`,
    schema: z.object({}),
  }
)
