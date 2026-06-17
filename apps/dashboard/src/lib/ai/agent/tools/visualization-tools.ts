import { z } from 'zod'

import { hostIdSchema, resolveHostId, validatedReadOnlyQuery } from './helpers'
import { dynamicTool } from 'ai'

export function createVisualizationTools(hostId: number) {
  return {
    query_and_visualize: dynamicTool({
      description:
        'Execute a SQL query and return structured visualization config. Automatically detects chart dimensions and measures from the result columns.',
      inputSchema: z.object({
        sql: z.string().describe('SQL query to execute and visualize'),
        title: z.string().optional().describe('Chart title'),
        chartType: z
          .enum(['bar', 'line', 'area', 'pie', 'number', 'table'])
          .optional()
          .describe('Suggested chart type'),
        xKey: z.string().optional().describe('Column for X axis'),
        yKeys: z
          .array(z.string())
          .optional()
          .describe('Column(s) for Y axis metrics'),
        sortBy: z.string().optional().describe('Column to sort by'),
        sortOrder: z
          .enum(['asc', 'desc'])
          .optional()
          .describe('Sort direction'),
        readable: z
          .enum(['bytes', 'duration', 'number', 'quantity'])
          .optional()
          .describe('Value format hint'),
        hostId: hostIdSchema,
      }),
      execute: async (input: unknown) => {
        const {
          sql,
          title,
          chartType,
          xKey: inputXKey,
          yKeys: inputYKeys,
          sortBy,
          sortOrder,
          readable,
          hostId: paramHostId,
        } = input as {
          sql: string
          title?: string
          chartType?: 'bar' | 'line' | 'area' | 'pie' | 'number' | 'table'
          xKey?: string
          yKeys?: string[]
          sortBy?: string
          sortOrder?: 'asc' | 'desc'
          readable?: 'bytes' | 'duration' | 'number' | 'quantity'
          hostId?: number
        }

        const effectiveHostId = resolveHostId(paramHostId, hostId)
        const rows = (await validatedReadOnlyQuery({
          sql,
          hostId: effectiveHostId,
        })) as Record<string, unknown>[]

        const columns = rows.length > 0 ? Object.keys(rows[0]) : []
        const firstRow = rows[0] ?? {}

        const resolvedXKey =
          inputXKey ??
          (columns.length > 0
            ? (columns.find((col) => typeof firstRow[col] === 'string') ??
              columns[0])
            : '')

        let resolvedYKeys = inputYKeys ?? []
        if (resolvedYKeys.length === 0) {
          resolvedYKeys = columns.filter(
            (col) => col !== resolvedXKey && typeof firstRow[col] === 'number'
          )
          if (resolvedYKeys.length === 0) {
            resolvedYKeys = columns.filter((col) => col !== resolvedXKey)
          }
        }

        const resolvedChartType =
          chartType ??
          (rows.length === 1 && resolvedYKeys.length === 1 ? 'number' : 'bar')

        return {
          type: 'visualization' as const,
          title: title ?? sql.slice(0, 60),
          sql,
          rows,
          rowCount: rows.length,
          columns,
          viz: {
            chartType: resolvedChartType,
            xKey: resolvedXKey,
            yKeys: resolvedYKeys,
            ...(sortBy !== undefined ? { sortBy } : {}),
            ...(sortOrder !== undefined ? { sortOrder } : {}),
            ...(readable !== undefined ? { readable } : {}),
          },
        }
      },
    }),
  }
}
