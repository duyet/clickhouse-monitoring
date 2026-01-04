/**
 * SQL Builder Examples
 *
 * Real-world usage examples for the SQL builder.
 * These are complete, runnable examples demonstrating various patterns.
 */

import { col, fn, param, raw } from './index'

/**
 * Example 1: Query Monitoring Dashboard
 *
 * Build a query for monitoring slow queries with performance metrics
 */
export function buildQueryMonitoringQuery() {
  const columns = [
    col('query_id'),
    col('user'),
    col('type'),
    col('query_duration_ms').as('duration'),
    col('read_rows').quantity(),
    col('read_bytes').readable(),
    col('memory_usage').readable(),
    col('query_duration_ms').pctOfMax().as('pct_duration'),
    col('read_bytes').pctOfMax(1).as('pct_bytes'),
  ]

  const sql = `
SELECT
  ${columns.map((c) => c.toSql()).join(',\n  ')}
FROM system.query_log
WHERE event_time >= ${param('start_time', 'DateTime')}
  AND event_time <= ${param('end_time', 'DateTime')}
  AND type IN (1, 2)
  AND query_duration_ms >= ${param('min_duration', 'UInt32')}
  AND user = ${param('user', 'String')}
ORDER BY query_duration_ms DESC
LIMIT ${param('limit', 'UInt32')}
`

  return {
    sql: sql.trim(),
    params: {
      start_time: 'now() - INTERVAL 1 HOUR',
      end_time: 'now()',
      min_duration: '1000',
      user: 'default',
      limit: '100',
    },
  }
}

/**
 * Example 2: User Activity Aggregation
 *
 * Aggregate query statistics by user with totals
 */
export function buildUserActivityQuery() {
  const columns = [
    col('user'),
    col.count('query_id').as('query_count'),
    col.sum('read_rows').as('total_rows_read'),
    col.sum('read_bytes').as('total_bytes_read'),
    col.avg('query_duration_ms').as('avg_duration_ms'),
    col.max('memory_usage').as('peak_memory'),
    col.min('query_duration_ms').as('fastest_query_ms'),
  ]

  const readableSummary = [
    col('user'),
    raw(`${fn.count('query_id')}`).as('queries'),
    raw(`${fn.readableQuantity('sum(read_rows)')}`).as('rows'),
    raw(`${fn.readableSize('sum(read_bytes)')}`).as('bytes'),
    raw(`${fn.readableTimeDelta('avg(query_duration_ms) / 1000')}`).as(
      'avg_time'
    ),
  ]

  const sql = `
WITH aggregated AS (
  SELECT
    ${columns.map((c) => c.toSql()).join(',\n    ')}
  FROM system.query_log
  WHERE event_date = ${fn.today()}
    AND type IN (1, 2)
  GROUP BY user
)
SELECT
  ${readableSummary.map((c) => c.toSql()).join(',\n  ')}
FROM aggregated
ORDER BY query_count DESC
`

  return sql.trim()
}

/**
 * Example 3: Profile Events Monitoring
 *
 * Track system profile events over time
 */
export function buildProfileEventsQuery() {
  const columns = [
    col('event_time'),
    raw(fn.profileEvent('Query')).as('queries'),
    raw(fn.profileEvent('SelectQuery')).as('select_queries'),
    raw(fn.profileEvent('InsertQuery')).as('insert_queries'),
    raw(fn.profileEvent('FailedQuery')).as('failed_queries'),
    raw(fn.profileEvent('MemoryTracking')).as('memory_tracking'),
  ]

  // Calculate rates
  const rates = [
    col('event_time'),
    raw('queries - lag(queries) OVER (ORDER BY event_time)').as(
      'queries_per_sec'
    ),
    raw('select_queries - lag(select_queries) OVER (ORDER BY event_time)').as(
      'selects_per_sec'
    ),
    raw('failed_queries - lag(failed_queries) OVER (ORDER BY event_time)').as(
      'failures_per_sec'
    ),
  ]

  const sql = `
WITH events AS (
  SELECT
    ${columns.map((c) => c.toSql()).join(',\n    ')}
  FROM system.metric_log
  WHERE event_time >= ${fn.now()} - INTERVAL 1 HOUR
)
SELECT
  ${rates.map((c) => c.toSql()).join(',\n  ')}
FROM events
ORDER BY event_time DESC
`

  return sql.trim()
}

/**
 * Example 4: Table Size Analysis
 *
 * Analyze table sizes with rankings
 */
export function buildTableSizeQuery() {
  const columns = [
    col('database'),
    col('table'),
    col('total_rows').quantity(),
    col('total_bytes').readable(),
    col('total_bytes').pctOfMax().as('pct_of_total'),
    col('total_bytes').over({ orderBy: 'total_bytes DESC' }).as('rank'),
  ]

  const sql = `
SELECT
  ${columns.map((c) => c.toSql()).join(',\n  ')}
FROM system.tables
WHERE database != 'system'
ORDER BY total_bytes DESC
LIMIT 50
`

  return sql.trim()
}

/**
 * Example 5: Merge Activity with Window Functions
 *
 * Track merge operations with partitioned analytics
 */
export function buildMergeActivityQuery() {
  const columns = [
    col('database'),
    col('table'),
    col('elapsed').timeDelta(),
    col('progress').as('merge_progress'),
    col('num_parts'),
    col('total_size_bytes_compressed').readable(),
    col('elapsed')
      .over({
        partitionBy: ['database', 'table'],
        orderBy: 'event_time DESC',
      })
      .as('elapsed_rank'),
    col('elapsed').pctOfMax().as('pct_slowest'),
  ]

  const sql = `
SELECT
  ${columns.map((c) => c.toSql()).join(',\n  ')}
FROM system.merges
WHERE is_mutation = 0
ORDER BY database, table, event_time DESC
`

  return sql.trim()
}

/**
 * Example 6: Complex CASE Statement with Raw SQL
 *
 * Categorize queries by resource usage
 */
export function buildQueryCategorization() {
  const columns = [
    col('query_id'),
    col('user'),
    col('read_bytes').readable(),
    col('query_duration_ms').as('duration_ms'),
    raw(`
      CASE
        WHEN read_bytes > 1000000000 THEN 'heavy'
        WHEN read_bytes > 100000000 THEN 'medium'
        ELSE 'light'
      END
    `).as('io_category'),
    raw(`
      CASE
        WHEN query_duration_ms > 60000 THEN 'slow'
        WHEN query_duration_ms > 10000 THEN 'moderate'
        ELSE 'fast'
      END
    `).as('speed_category'),
  ]

  const sql = `
SELECT
  ${columns.map((c) => c.toSql()).join(',\n  ')}
FROM system.query_log
WHERE event_date = ${fn.today()}
  AND type IN (1, 2)
ORDER BY read_bytes DESC
`

  return sql.trim()
}

/**
 * Example 7: Top N per Group
 *
 * Get top 5 slowest queries per user
 */
export function buildTopQueriesPerUser() {
  const rankedColumns = [
    col('user'),
    col('query_id'),
    col('query_duration_ms'),
    col('query_duration_ms')
      .over({
        partitionBy: 'user',
        orderBy: 'query_duration_ms DESC',
      })
      .as('rank_in_user'),
  ]

  const sql = `
WITH ranked AS (
  SELECT
    ${rankedColumns.map((c) => c.toSql()).join(',\n    ')}
  FROM system.query_log
  WHERE event_date = ${fn.today()}
    AND type = 2
)
SELECT
  user,
  query_id,
  ${fn.readableTimeDelta('query_duration_ms / 1000')} AS duration
FROM ranked
WHERE rank_in_user <= 5
ORDER BY user, rank_in_user
`

  return sql.trim()
}

// Demo: Run all examples
if (require.main === module) {
  console.log('=== Query Monitoring ===')
  console.log(buildQueryMonitoringQuery().sql)
  console.log()

  console.log('=== User Activity ===')
  console.log(buildUserActivityQuery())
  console.log()

  console.log('=== Profile Events ===')
  console.log(buildProfileEventsQuery())
  console.log()

  console.log('=== Table Size Analysis ===')
  console.log(buildTableSizeQuery())
  console.log()

  console.log('=== Merge Activity ===')
  console.log(buildMergeActivityQuery())
  console.log()

  console.log('=== Query Categorization ===')
  console.log(buildQueryCategorization())
  console.log()

  console.log('=== Top Queries Per User ===')
  console.log(buildTopQueriesPerUser())
}
