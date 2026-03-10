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
    description:
      'List all available pre-configured charts. Returns an array of chart names that can be used with get_chart_data.',
    schema: z.object({}),
  }
)
