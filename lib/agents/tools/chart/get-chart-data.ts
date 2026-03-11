/**
 * LangGraph tool: Get data for a specific chart.
 *
 * This tool enables LLMs to fetch pre-configured chart data without
 * writing SQL. Leverages the existing chart registry.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { getChartQuery } from '@/lib/api/chart-registry'
import { fetchData } from '@/lib/clickhouse'

/**
 * Get data for a specific chart by name
 *
 * Fetches data for a pre-configured chart. Charts are defined in the
 * chart registry and include time-series data, metrics, and more.
 */
export const getChartDataTool = tool(
  async ({ name, hostId = 0, params = {} }) => {
    // Get chart SQL from registry
    const chartResult = getChartQuery(name, params)

    if (!chartResult) {
      throw new Error(`Chart not found: ${name}`)
    }

    // Handle both single and multi-chart queries
    const sql =
      'queries' in chartResult
        ? (chartResult.queries[0]?.query ?? '')
        : chartResult.query

    // Use provided params (multi-chart queries don't have default params)
    const effectiveParams = params

    const result = await fetchData({
      query: sql,
      query_params: effectiveParams as Record<string, unknown>,
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to get chart data: ${result.error.message}`)
    }

    const data = (result.data ?? []) as readonly unknown[]

    return {
      chart: name,
      data,
      dataPointCount: data.length,
      params,
      hostId,
    }
  },
  {
    name: 'get_chart_data',
    description: `Get data for a specific pre-configured monitoring chart.

**Use this tool when user asks about:**
- "Show me <chart name> data", "get chart data for..."
- Specific metrics that have pre-configured charts
- Time-series data and visualization data

**Parameters:**
- name (required): Chart name (use list_charts to discover available charts)
- params (optional): Chart-specific parameters (e.g., time range filters)

**Returns:** Chart data array with metadata

**Example:** get_chart_data(name="query-count") → { chart: "query-count", data: [{timestamp: "2024-01-01", count: 100}], dataPointCount: 1440 }

**Common charts:** query-count, top-tables-size, merge-operations, running-queries, disk-usage, query-types`,
    schema: z.object({
      name: z
        .string()
        .describe('Chart name (use list_charts to discover available charts)'),
      hostId: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe('Host index (default: 0)'),
      params: z
        .record(z.string(), z.any())
        .optional()
        .default({})
        .describe('Optional chart-specific parameters'),
    }),
  }
)
