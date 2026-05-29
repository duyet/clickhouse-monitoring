import type { Thresholds } from '@/lib/health/thresholds-storage'

export interface RelatedLink {
  label: string
  /** Internal route. `?host=` is appended automatically. */
  href: string
}

export interface DocsLink {
  label: string
  /** External URL. */
  url: string
}

export interface HealthCheckDef {
  id: string
  title: string
  chartName: string
  /** Field on first data row to read the numeric value from. */
  valueKey: string
  /** Default warning/critical thresholds. */
  defaults: Thresholds
  /** Human-readable label for the value (lowercase). */
  unit?: string
  /** Format the displayed label. */
  formatLabel?: (value: number | null) => string
  /** Format the displayed value (defaults to toLocaleString). */
  formatValue?: (value: number | null) => string
  /** Short description shown in the detail dialog. */
  description?: string
  /** System tables this check probes — surfaced in the audit prompt. */
  systemTables?: readonly string[]
  /** Likely causes — surfaced in the detail dialog and audit prompt. */
  commonCauses?: readonly string[]
  /** Internal pages relevant to the check. */
  relatedLinks?: readonly RelatedLink[]
  /** External documentation links. */
  docsLinks?: readonly DocsLink[]
}

const fmtCount = (singular: string, plural?: string) => (v: number | null) => {
  const n = v ?? 0
  return `${n.toLocaleString()} ${n === 1 ? singular : (plural ?? `${singular}s`)}`
}

export const HEALTH_CHECKS: readonly HealthCheckDef[] = [
  {
    id: 'readonly-replicas',
    title: 'Readonly Replicas',
    chartName: 'health-readonly-replicas',
    valueKey: 'readonly_count',
    defaults: { warning: 1, critical: 3 },
    formatLabel: fmtCount('readonly replica'),
    description:
      'Replicas in read-only mode cannot accept writes. Typical causes are ZooKeeper/Keeper connectivity loss or replica metadata corruption.',
    systemTables: ['system.replicas', 'system.replication_queue'],
    commonCauses: [
      'ZooKeeper / ClickHouse Keeper unavailable or laggy',
      'Replica metadata corruption (force_restore_data required)',
      'Disk full on the replica',
    ],
    relatedLinks: [
      { label: 'Readonly Tables', href: '/readonly-tables' },
      { label: 'Replicas', href: '/replicas' },
      { label: 'Replication Queue', href: '/replication-queue' },
    ],
    docsLinks: [
      {
        label: 'system.replicas',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/replicas',
      },
      {
        label: 'Data Replication',
        url: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/replication',
      },
    ],
  },
  {
    id: 'delayed-inserts',
    title: 'Delayed Inserts',
    chartName: 'health-delayed-inserts',
    valueKey: 'delayed_inserts',
    defaults: { warning: 1, critical: 5 },
    formatLabel: fmtCount('delayed insert'),
    description:
      'INSERTs are being throttled because partitions have too many parts. The MergeTree throttles writes once `parts_to_delay_insert` is exceeded.',
    systemTables: ['system.metrics', 'system.parts'],
    commonCauses: [
      'Too-small batches producing many parts (recommend ≥ 1000 rows / insert)',
      'Background merges starved (low background pool size, slow disk)',
      '`parts_to_delay_insert` / `parts_to_throw_insert` tuned too low',
    ],
    relatedLinks: [
      { label: 'Tables Overview', href: '/tables-overview' },
      { label: 'Merges', href: '/merges' },
      { label: 'Merge Performance', href: '/merge-performance' },
    ],
    docsLinks: [
      {
        label: 'MergeTree settings (parts_to_delay_insert)',
        url: 'https://clickhouse.com/docs/en/operations/settings/merge-tree-settings#parts-to-delay-insert',
      },
    ],
  },
  {
    id: 'max-parts',
    title: 'Max Parts / Partition',
    chartName: 'health-max-part-count',
    valueKey: 'part_count',
    defaults: { warning: 150, critical: 300 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} parts (max partition)`,
    description:
      'A high active part count in a single partition signals that background merges are not keeping up with inserts. Sustained pressure leads to throttled then rejected inserts.',
    systemTables: ['system.parts', 'system.merges'],
    commonCauses: [
      'Frequent small inserts (no batching)',
      'Partition key too granular (e.g., per-hour partitions)',
      'Insufficient background_pool_size or slow storage',
    ],
    relatedLinks: [
      { label: 'Merges', href: '/merges' },
      { label: 'Tables Overview', href: '/tables-overview' },
      { label: 'Mutations', href: '/mutations' },
    ],
    docsLinks: [
      {
        label: 'system.parts',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/parts',
      },
      {
        label: 'Custom Partitioning Key',
        url: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/custom-partitioning-key',
      },
    ],
  },
  {
    id: 'long-running-queries',
    title: 'Long-Running Queries',
    chartName: 'health-long-running-queries',
    valueKey: 'long_running',
    defaults: { warning: 1, critical: 5 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} queries > 60s`,
    description:
      'Initial queries running for more than 60 seconds. Heavy aggregations, missing indexes, or runaway queries are common offenders.',
    systemTables: ['system.processes', 'system.query_log'],
    commonCauses: [
      'Missing PRIMARY KEY / sort order for the query pattern',
      'Cross-shard JOINs without distributed_product_mode tuning',
      'Stuck query waiting on lock or external resource',
    ],
    relatedLinks: [
      { label: 'Running Queries', href: '/running-queries' },
      { label: 'Slow Queries', href: '/slow-queries' },
      { label: 'Expensive Queries', href: '/expensive-queries' },
    ],
    docsLinks: [
      {
        label: 'system.processes',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/processes',
      },
      {
        label: 'KILL QUERY',
        url: 'https://clickhouse.com/docs/en/sql-reference/statements/kill',
      },
    ],
  },
  {
    id: 'oom-killed',
    title: 'OOM-Killed Queries (1h)',
    chartName: 'health-oom-killed-recent',
    valueKey: 'oom_count',
    defaults: { warning: 1, critical: 10 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} OOM kills in last hour`,
    description:
      'Queries that exceeded `max_memory_usage` or hit MEMORY_LIMIT_EXCEEDED. Indicates aggregation/order-by spilling needs tuning or per-user limits are too low.',
    systemTables: ['system.query_log'],
    commonCauses: [
      '`max_memory_usage` set too low for the workload',
      'GROUP BY / DISTINCT / ORDER BY on high-cardinality columns without `max_bytes_before_external_*`',
      'Memory pressure from concurrent queries (lacking quotas)',
    ],
    relatedLinks: [
      { label: 'Failed Queries', href: '/failed-queries' },
      { label: 'Expensive Queries', href: '/expensive-queries' },
      { label: 'Metrics', href: '/metrics' },
    ],
    docsLinks: [
      {
        label: 'Memory Settings (max_memory_usage)',
        url: 'https://clickhouse.com/docs/en/operations/settings/query-complexity#max_memory_usage',
      },
      {
        label: 'External aggregation/sorting',
        url: 'https://clickhouse.com/docs/en/operations/settings/query-complexity#settings-max_bytes_before_external_group_by',
      },
    ],
  },
  {
    id: 'failed-queries',
    title: 'Failed Queries (1h)',
    chartName: 'health-failed-queries-recent',
    valueKey: 'failed_count',
    defaults: { warning: 10, critical: 100 },
    formatLabel: (v) =>
      `${(v ?? 0).toLocaleString()} failed queries in last hour`,
    description:
      'Recent query failures across all users. A sudden spike often points to a broken client, schema change, or quota/limit hit.',
    systemTables: ['system.query_log', 'system.errors'],
    commonCauses: [
      'Recent schema/DDL change incompatible with existing clients',
      'Quota exceeded or `max_concurrent_queries` reached',
      'Network instability between client and server',
    ],
    relatedLinks: [
      { label: 'Failed Queries', href: '/failed-queries' },
      { label: 'History Queries', href: '/history-queries' },
    ],
    docsLinks: [
      {
        label: 'system.query_log',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/query_log',
      },
      {
        label: 'system.errors',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/errors',
      },
    ],
  },
  {
    id: 'replication-lag',
    title: 'Replication Lag',
    chartName: 'health-replication-lag',
    valueKey: 'max_lag',
    defaults: { warning: 30, critical: 300 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()}s max delay`,
    description:
      'Maximum `absolute_delay` across all replicas (seconds behind the leader). Sustained lag means readers may see stale data.',
    systemTables: ['system.replicas', 'system.replication_queue'],
    commonCauses: [
      'Slow network or saturated inter-server connections',
      'Large fetch backlog in `replication_queue`',
      'ZooKeeper / Keeper latency',
    ],
    relatedLinks: [
      { label: 'Replicas', href: '/replicas' },
      { label: 'Replication Queue', href: '/replication-queue' },
      { label: 'Clusters', href: '/clusters' },
    ],
    docsLinks: [
      {
        label: 'system.replicas',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/replicas',
      },
      {
        label: 'Replication Troubleshooting',
        url: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/replication#recovery-after-failures',
      },
    ],
  },
  {
    id: 'keeper-exceptions',
    title: 'Keeper Exceptions (1h)',
    chartName: 'health-keeper-exceptions-recent',
    valueKey: 'exception_count',
    defaults: { warning: 1, critical: 20 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} exceptions in last hour`,
    description:
      'Recent KEEPER_EXCEPTION events. Sustained exceptions usually indicate quorum issues, network partitions, or overloaded Keeper nodes.',
    systemTables: ['system.error_log', 'system.errors'],
    commonCauses: [
      'Keeper node CPU/disk saturated',
      'Lost quorum / network partition between Keeper hosts',
      'snapshot_distance / reserved_log_items misconfiguration',
    ],
    relatedLinks: [
      { label: 'ZooKeeper', href: '/zookeeper?path=/' },
      { label: 'Clusters', href: '/clusters' },
    ],
    docsLinks: [
      {
        label: 'ClickHouse Keeper',
        url: 'https://clickhouse.com/docs/en/operations/clickhouse-keeper',
      },
    ],
  },
  {
    id: 'memory-percent',
    title: 'Memory Usage',
    chartName: 'health-memory-percent',
    valueKey: 'memory_percent',
    defaults: { warning: 80, critical: 95 },
    formatLabel: (v) => `${v ?? 0}% of OS memory`,
    formatValue: (v) => (v == null ? '—' : `${v}%`),
    description:
      'OS-level memory utilization on the ClickHouse host. Sustained pressure leads to OOM kills, page-cache eviction, and increased GC pause time.',
    systemTables: ['system.asynchronous_metrics', 'system.processes'],
    commonCauses: [
      'Per-query memory limits set above safe per-host budget',
      'Mark cache / uncompressed cache configured too large',
      'Memory leak in user-defined functions or external dictionaries',
    ],
    relatedLinks: [
      { label: 'Metrics', href: '/metrics' },
      { label: 'Asynchronous Metrics', href: '/asynchronous-metrics' },
      { label: 'Expensive Queries', href: '/expensive-queries' },
    ],
    docsLinks: [
      {
        label: 'system.asynchronous_metrics',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/asynchronous_metrics',
      },
    ],
  },
  {
    id: 'disk-percent',
    title: 'Disk Usage',
    chartName: 'health-disk-percent',
    valueKey: 'disk_percent',
    defaults: { warning: 80, critical: 95 },
    formatLabel: (v) => `${v ?? 0}% used (worst disk)`,
    formatValue: (v) => (v == null ? '—' : `${v}%`),
    description:
      'Worst-case disk utilization across all configured volumes. Hitting 100% halts writes and can prevent merges from completing.',
    systemTables: ['system.disks', 'system.parts'],
    commonCauses: [
      'TTL not applied / partition retention misconfigured',
      'Stuck large merges holding temporary copies',
      'Frozen backups not cleaned up',
    ],
    relatedLinks: [
      { label: 'Disks', href: '/disks' },
      { label: 'Tables Overview', href: '/tables-overview' },
      { label: 'Backups', href: '/backups' },
    ],
    docsLinks: [
      {
        label: 'system.disks',
        url: 'https://clickhouse.com/docs/en/operations/system-tables/disks',
      },
      {
        label: 'Storage Policies & TTL',
        url: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree#table_engine-mergetree-multiple-volumes',
      },
    ],
  },
] as const
