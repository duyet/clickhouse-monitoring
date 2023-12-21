export const listDatabases = `
  WITH tables_from_tables AS (
    SELECT
        database,
        name AS table,
        engine
    FROM system.tables
  )

  SELECT d.name as name,
         countDistinct(t.table) as count
  FROM system.databases AS d
  LEFT JOIN tables_from_tables AS t USING database
  WHERE d.engine = 'Atomic'
  GROUP BY d.name
`

export const listTables = `
  WITH tables_from_parts AS (
    SELECT
        database,
        table,
        engine,
        sum(data_compressed_bytes) as compressed_bytes,
        sum(data_uncompressed_bytes) AS uncompressed_bytes,
        formatReadableSize(compressed_bytes) AS compressed,
        formatReadableSize(uncompressed_bytes) AS uncompressed,
        round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
        sum(rows) AS total_rows,
        formatReadableQuantity(sum(rows)) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE active = 1 AND database = {database: String}
    GROUP BY database,
             table,
             engine
  ),
  tables_from_tables AS (
    SELECT database,
           name AS table,
           engine
    FROM system.tables
    WHERE database = {database: String}
  )
  SELECT tables_from_tables.*,
         tables_from_parts.*
  FROM tables_from_tables
  LEFT JOIN tables_from_parts USING database, table
  ORDER BY database, compressed_bytes DESC
`
