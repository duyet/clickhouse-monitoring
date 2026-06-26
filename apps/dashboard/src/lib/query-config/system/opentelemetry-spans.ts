import type { QueryConfig } from '@/types/query-config'
import { ColumnFormat } from '@/types/column-format'

/**
 * system.opentelemetry_span_log — available when OpenTelemetry tracing is
 * configured (opentelemetry_start_trace_probability > 0).
 * Records distributed trace spans for queries, showing execution across
 * replicas/shards with per-span duration and operation breakdown.
 */
export const opentelemetrySpansConfig: QueryConfig = {
  name: 'opentelemetry-spans',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['operation_name'] },
  description:
    'Distributed query trace spans from system.opentelemetry_span_log. Groups by trace_id to show full waterfall across replicas and shards.',
  refreshInterval: 30_000,
  optional: true,
  tableCheck: 'system.opentelemetry_span_log',
  sql: [
    {
      since: '21.1',
      description: 'OTel spans with duration, ordered by start time descending',
      sql: `
        SELECT
          hex(trace_id) AS trace_id,
          hex(span_id) AS span_id,
          hex(parent_span_id) AS parent_span_id,
          operation_name,
          toDateTime(intDiv(start_time_us, 1000000)) AS start_time,
          (finish_time_us - start_time_us) AS duration_us,
          formatReadableTimeDelta(
            toDecimal64(finish_time_us - start_time_us, 0) / 1000000
          ) AS readable_duration,
          round((finish_time_us - start_time_us) * 100.0 / nullIf(max(finish_time_us - start_time_us) OVER (), 0), 2) AS pct_duration,
          finish_date,
          attribute['clickhouse.query_id'] AS query_id,
          attribute['net.peer.name'] AS host
        FROM system.opentelemetry_span_log
        WHERE finish_date >= today() - 1
        ORDER BY start_time_us DESC
        LIMIT 1000
      `,
    },
  ],
  columns: [
    'trace_id',
    'span_id',
    'parent_span_id',
    'operation_name',
    'start_time',
    'readable_duration',
    'finish_date',
    'query_id',
    'host',
  ],
  columnFormats: {
    trace_id: ColumnFormat.Code,
    span_id: ColumnFormat.Code,
    parent_span_id: ColumnFormat.Code,
    operation_name: ColumnFormat.ColoredBadge,
    start_time: ColumnFormat.RelatedTime,
    readable_duration: ColumnFormat.BackgroundBar,
    query_id: [
      ColumnFormat.Link,
      { href: '/query?query_id=[query_id]&host=[ctx.hostId]' },
    ],
    host: ColumnFormat.ColoredBadge,
  },
}
