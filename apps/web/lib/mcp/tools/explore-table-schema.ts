import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

export function registerExploreTableSchemaTool(server: McpServer) {
  server.tool(
    'explore_table_schema',
    'Comprehensive schema exploration with relationship discovery. Three modes: no params (list databases), database only (summarize tables), database+table (full schema with relationships)',
    {
      database: z
        .string()
        .optional()
        .describe('Database name (optional - if omitted, lists all databases)'),
      table: z
        .string()
        .optional()
        .describe(
          'Table name (requires database. If provided, returns full schema with relationships)'
        ),
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ database, table, hostId }) => {
      const effectiveHostId = hostId ?? 0
      const fetchOpts = {
        hostId: effectiveHostId,
        format: 'JSONEachRow' as const,
        clickhouse_settings: { readonly: '1' as const },
      }

      // Mode 1: No params — list databases
      if (!database) {
        const result = await fetchData({
          ...fetchOpts,
          query:
            'SELECT name, engine, comment FROM system.databases ORDER BY name',
        })

        if (result.error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${result.error.message}`,
              },
            ],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        }
      }

      // Mode 2: Database only — list tables with details
      if (!table) {
        const result = await fetchData({
          ...fetchOpts,
          query: `SELECT name, engine, partition_key, sorting_key, total_rows, formatReadableSize(total_bytes) AS size FROM system.tables WHERE database = {database:String} AND is_temporary = 0 AND name NOT LIKE '.inner_%' ORDER BY total_bytes DESC`,
          query_params: { database },
        })

        if (result.error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${result.error.message}`,
              },
            ],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        }
      }

      // Mode 3: Database + table — full schema with relationships
      const [metadataResult, columnsResult, upstreamResult, downstreamResult] =
        await Promise.all([
          fetchData({
            ...fetchOpts,
            query: `SELECT database, name, engine, partition_key, sorting_key, primary_key, total_rows, formatReadableSize(total_bytes) AS size FROM system.tables WHERE database = {database:String} AND name = {table:String}`,
            query_params: { database, table },
          }),
          fetchData({
            ...fetchOpts,
            query: `SELECT name, type, is_in_primary_key, is_in_sorting_key, is_in_partition_key FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position`,
            query_params: { database, table },
          }),
          fetchData({
            ...fetchOpts,
            query: `SELECT t2.database AS dep_database, t2.name AS dep_table, t2.engine FROM system.tables AS t1 INNER JOIN system.tables AS t2 ON t1.create_table_query LIKE concat('%', t2.database, '.', t2.name, '%') WHERE t1.database = {database:String} AND t1.name = {table:String} AND t2.database != '' AND NOT (t2.database = {database:String} AND t2.name = {table:String})`,
            query_params: { database, table },
          }),
          fetchData({
            ...fetchOpts,
            query: `SELECT t2.database AS dependent_database, t2.name AS dependent_table, t2.engine FROM system.tables AS t1 INNER JOIN system.tables AS t2 ON t2.create_table_query LIKE concat('%', t1.database, '.', t1.name, '%') WHERE t1.database = {database:String} AND t1.name = {table:String} AND t2.database != '' AND NOT (t2.database = {database:String} AND t2.name = {table:String})`,
            query_params: { database, table },
          }),
        ])

      const errors = [
        metadataResult,
        columnsResult,
        upstreamResult,
        downstreamResult,
      ]
        .filter((r) => r.error)
        .map((r) => r.error!.message)

      if (errors.length > 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Errors: ${errors.join('; ')}`,
            },
          ],
          isError: true,
        }
      }

      const tableMetadata = Array.isArray(metadataResult.data)
        ? metadataResult.data[0]
        : metadataResult.data

      const combined = {
        table: tableMetadata,
        columns: columnsResult.data,
        upstream_dependencies: upstreamResult.data,
        downstream_dependencies: downstreamResult.data,
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(combined, null, 2),
          },
        ],
      }
    }
  )
}
