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
        sum(data_compressed_bytes) as compressed,
        sum(data_uncompressed_bytes) AS uncompressed,
        formatReadableSize(compressed) AS readable_compressed,
        formatReadableSize(uncompressed) AS readable_uncompressed,
        round(uncompressed / compressed, 2) AS compr_rate,
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
           engine,
           comment
    FROM system.tables
    WHERE database = {database: String}
  ),

  summary AS (
    SELECT tables_from_tables.*,
           tables_from_parts.*
    FROM tables_from_tables
    LEFT JOIN tables_from_parts USING database, table
    ORDER BY database, compressed DESC
  )
  
  SELECT *,
    round(100 * compressed / max(compressed) OVER ()) AS pct_compressed,
    round(100 * uncompressed / max(uncompressed) OVER ()) AS pct_uncompressed,
    round(100 * total_rows / max(total_rows) OVER ()) AS pct_total_rows,
    round(100 * part_count / max(part_count) OVER ()) AS pct_part_count,
    round(100 * compr_rate / max(compr_rate) OVER ()) AS pct_compr_rate
  FROM summary
`
