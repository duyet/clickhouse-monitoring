import 'server-only'

import { readOnlyQuery, resolveHostId, validatedReadOnlyQuery } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

const NUMERIC_TYPE_PREFIXES = [
  'UInt',
  'Int',
  'Float',
  'Decimal',
  'Nullable(UInt',
  'Nullable(Int',
  'Nullable(Float',
  'Nullable(Decimal',
]

function isNumericType(type: string): boolean {
  return NUMERIC_TYPE_PREFIXES.some((prefix) => type.startsWith(prefix))
}

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
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID (defaults to session host)'),
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

    discover_data_sources: dynamicTool({
      description:
        'Discover ClickHouse tables relevant to a search topic. Returns table metadata with column classification into measures and dimensions.',
      inputSchema: z.object({
        searchTerm: z.string().describe('Topic to search for'),
        database: z.string().optional().describe('Limit to specific database'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID (defaults to session host)'),
      }),
      execute: async (input: unknown) => {
        const {
          searchTerm,
          database,
          hostId: paramHostId,
        } = input as {
          searchTerm: string
          database?: string
          hostId?: number
        }

        const effectiveHostId = resolveHostId(paramHostId, hostId)

        // '' sentinel means "no database filter" — ClickHouse evaluates the AND branch as false
        const tables = (await readOnlyQuery({
          query: `SELECT database, name AS table, engine, total_rows, formatReadableSize(total_bytes) AS size, comment
                  FROM system.tables
                  WHERE (name ILIKE {pattern:String} OR comment ILIKE {pattern:String})
                    AND ({database:String} = '' OR database = {database:String})
                  ORDER BY total_bytes DESC
                  LIMIT 20`,
          hostId: effectiveHostId,
          query_params: {
            pattern: `%${searchTerm}%`,
            database: database ?? '',
          },
        })) as Array<{
          database: string
          table: string
          engine: string
          total_rows: number
          size: string
          comment: string
        }>

        if (tables.length === 0) {
          return {
            type: 'data_sources' as const,
            searchTerm,
            sources: [],
          }
        }

        const sourcesWithColumns = await Promise.all(
          tables.map(async (tbl) => {
            const columns = (await readOnlyQuery({
              query: `SELECT name, type FROM system.columns
                      WHERE database = {database:String} AND table = {table:String}
                      ORDER BY position`,
              hostId: effectiveHostId,
              query_params: { database: tbl.database, table: tbl.table },
            })) as Array<{ name: string; type: string }>

            const measures = columns
              .filter((col) => isNumericType(col.type))
              .map((col) => ({ name: col.name, type: col.type }))

            const dimensions = columns
              .filter((col) => !isNumericType(col.type))
              .map((col) => ({ name: col.name, type: col.type }))

            return {
              database: tbl.database,
              table: tbl.table,
              engine: tbl.engine,
              totalRows: tbl.total_rows,
              size: tbl.size,
              comment: tbl.comment ?? '',
              measures,
              dimensions,
            }
          })
        )

        return {
          type: 'data_sources' as const,
          searchTerm,
          sources: sourcesWithColumns,
        }
      },
    }),
  }
}
