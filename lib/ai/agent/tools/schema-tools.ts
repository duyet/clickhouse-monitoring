import type { DataFormat } from '@clickhouse/client'

import { readOnlyQuery, resolveHostId, validatedReadOnlyQuery } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createSchemaTools(hostId: number) {
  return {
    query: dynamicTool({
      description:
        'Execute read-only SQL queries on ClickHouse. Use this to fetch data, analyze metrics, and explore the database structure.',
      inputSchema: z.object({
        sql: z.string().describe('The SQL query to execute'),
        hostId: z
          .number()
          .optional()
          .describe('The host ID (defaults to the session host)'),
        format: z
          .string()
          .optional()
          .describe('Response format (default: JSONEachRow)'),
      }),
      execute: async (input: unknown) => {
        const {
          sql,
          hostId: paramHostId,
          format = 'JSONEachRow',
        } = input as {
          sql: string
          hostId?: number
          format?: string
        }
        const result = await validatedReadOnlyQuery({
          sql,
          hostId: paramHostId ?? hostId,
          format: format as DataFormat,
        })
        return result
      },
    }),

    list_databases: dynamicTool({
      description:
        'List all databases in ClickHouse with their engine and comment metadata.',
      inputSchema: z.object({
        hostId: z
          .number()
          .optional()
          .describe('The host ID (defaults to the session host)'),
      }),
      execute: async (input: unknown) => {
        const { hostId: paramHostId } = input as { hostId?: number }
        const effectiveHostId = resolveHostId(paramHostId, hostId)
        const result = await readOnlyQuery({
          query:
            'SELECT name, engine, comment FROM system.databases ORDER BY name',
          hostId: effectiveHostId,
        })
        return result
      },
    }),

    list_tables: dynamicTool({
      description:
        'List tables in a specific database with row counts and size information.',
      inputSchema: z.object({
        database: z.string().describe('The database name'),
        hostId: z
          .number()
          .optional()
          .describe('The host ID (defaults to the session host)'),
      }),
      execute: async (input: unknown) => {
        const { database, hostId: paramHostId } = input as {
          database: string
          hostId?: number
        }
        const effectiveHostId = resolveHostId(paramHostId, hostId)
        const result = await readOnlyQuery({
          query:
            'SELECT name, engine, total_rows, formatReadableSize(total_bytes) AS size FROM system.tables WHERE database = {database:String} ORDER BY total_bytes DESC',
          hostId: effectiveHostId,
          query_params: { database },
        })
        return result
      },
    }),

    get_table_schema: dynamicTool({
      description: 'Get the column schema for a specific table.',
      inputSchema: z.object({
        database: z.string().describe('The database name'),
        table: z.string().describe('The table name'),
        hostId: z
          .number()
          .optional()
          .describe('The host ID (defaults to the session host)'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          hostId: paramHostId,
        } = input as {
          database: string
          table: string
          hostId?: number
        }
        const effectiveHostId = resolveHostId(paramHostId, hostId)
        const result = await readOnlyQuery({
          query:
            'SELECT name, type, default_kind, default_expression, comment FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position',
          hostId: effectiveHostId,
          query_params: { database, table },
        })
        return result
      },
    }),

    explore_table_schema: dynamicTool({
      description:
        'Comprehensive schema exploration. With no parameters, lists all databases. With database only, lists tables. With both, returns full schema with columns, indexes, primary keys, and foreign keys.',
      inputSchema: z.object({
        database: z.string().optional().describe('The database name'),
        table: z.string().optional().describe('The table name'),
        hostId: z
          .number()
          .optional()
          .describe('The host ID (defaults to the session host)'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          hostId: paramHostId,
        } = input as {
          database?: string
          table?: string
          hostId?: number
        }
        const effectiveHostId = resolveHostId(paramHostId, hostId)

        // Mode 1: No parameters - list all databases
        if (!database) {
          const result = await readOnlyQuery({
            query:
              'SELECT name, engine, comment FROM system.databases ORDER BY name',
            hostId: effectiveHostId,
          })
          return {
            mode: 'databases',
            data: result,
          }
        }

        // Mode 2: Database only - list tables in database
        if (!table) {
          const result = await readOnlyQuery({
            query:
              'SELECT name, engine, total_rows, formatReadableSize(total_bytes) AS size FROM system.tables WHERE database = {database:String} ORDER BY name',
            hostId: effectiveHostId,
            query_params: { database },
          })
          return {
            mode: 'tables',
            database,
            data: result,
          }
        }

        // Mode 3: Database and table - full schema exploration
        const [columns, indexes, partitions, constraints] = await Promise.all([
          // Get columns
          readOnlyQuery({
            query:
              'SELECT name, type, default_kind, default_expression, comment FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position',
            hostId: effectiveHostId,
            query_params: { database, table },
          }),
          // Get indexes
          readOnlyQuery({
            query:
              'SELECT name, type, expression, granularity FROM system.data_skipping_indexes WHERE database = {database:String} AND table = {table:String} ORDER BY name',
            hostId: effectiveHostId,
            query_params: { database, table },
          }),
          // Get partition info
          readOnlyQuery({
            query:
              'SELECT partition, parts, is_inactive FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active = 1 ORDER BY partition',
            hostId: effectiveHostId,
            query_params: { database, table },
          }),
          // Get table constraints (primary key, etc.)
          readOnlyQuery({
            query:
              'SELECT partition_key, primary_key, sorting_key FROM system.tables WHERE database = {database:String} AND name = {table:String}',
            hostId: effectiveHostId,
            query_params: { database, table },
          }),
        ])

        // Foreign key detection - look for columns that might reference other tables
        let foreignKeys: unknown = []
        try {
          const fkCandidates = await readOnlyQuery({
            query: `SELECT c1.name as column_name, c1.type as column_type
             FROM system.columns c1
             WHERE c1.database = {database:String} AND c1.table = {table:String}
             AND (c1.name LIKE '%_id' OR c1.name LIKE '%_key')
             ORDER BY c1.name`,
            hostId: effectiveHostId,
            query_params: { database, table },
          })
          foreignKeys = fkCandidates
        } catch {
          // If FK query fails, continue without FK data
          foreignKeys = []
        }

        return {
          mode: 'schema',
          database,
          table,
          columns,
          indexes,
          partitions,
          constraints,
          foreignKeys,
        }
      },
    }),
  }
}
