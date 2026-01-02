import type { QueryConfig } from '@/types/query-config'

/**
 * Query to get downstream dependencies (tables that depend on this table).
 * This uses the dependencies_database and dependencies_table arrays in system.tables.
 */
export const explorerDependenciesDownstreamConfig: QueryConfig = {
  name: 'explorer-dependencies-downstream',
  description: 'Tables and views that depend on this table (downstream)',
  sql: `
    SELECT
        database AS dependent_database,
        name AS dependent_table,
        engine,
        if(engine = 'MaterializedView', 'Materialized View',
           if(engine = 'View', 'View', 'Table')) AS type,
        create_table_query
    FROM system.tables
    WHERE has(dependencies_database, {database:String})
      AND has(dependencies_table, {table:String})
    ORDER BY database, name
  `,
  columns: [
    'dependent_database',
    'dependent_table',
    'engine',
    'type',
    'create_table_query',
  ],
  defaultParams: { database: 'default', table: '' },
}

/**
 * Query to get upstream dependencies (tables that this table depends on).
 * This reads the dependencies arrays for the current table.
 */
export const explorerDependenciesUpstreamConfig: QueryConfig = {
  name: 'explorer-dependencies-upstream',
  description: 'Tables that this table depends on (upstream)',
  sql: `
    SELECT
        dep_db AS source_database,
        dep_table AS source_table,
        st.engine,
        if(st.engine = 'MaterializedView', 'Materialized View',
           if(st.engine = 'View', 'View', 'Table')) AS type
    FROM (
        SELECT
            arrayJoin(dependencies_database) AS dep_db,
            arrayJoin(dependencies_table) AS dep_table
        FROM system.tables
        WHERE database = {database:String}
          AND name = {table:String}
    ) AS deps
    LEFT JOIN system.tables AS st ON st.database = deps.dep_db AND st.name = deps.dep_table
    ORDER BY source_database, source_table
  `,
  columns: ['source_database', 'source_table', 'engine', 'type'],
  defaultParams: { database: 'default', table: '' },
}
