/**
 * Constants for ClickHouse schema documentation generator
 */

/**
 * System tables to track
 */
export const TARGET_TABLES = [
  'system.processes',
  'system.query_log',
  'system.parts',
  'system.merges',
  'system.replicas',
  'system.tables',
  'system.columns',
  'system.disks',
  'system.clusters',
  'system.mutations',
  'system.replication_queue',
  'system.dictionaries',
  'system.settings',
  'system.metrics',
  'system.events',
  'system.asynchronous_metrics',
] as const

/**
 * Supported major versions
 */
export const SUPPORTED_MAJOR_VERSIONS = [23, 24, 25, 26] as const

/**
 * Known LTS versions
 */
export const LTS_VERSIONS = ['23.3', '23.8', '24.3', '24.8'] as const

/**
 * GitHub URLs for fetching changelog and docs
 */
export const GITHUB_URLS = {
  changelog:
    'https://raw.githubusercontent.com/ClickHouse/ClickHouse/master/CHANGELOG.md',
  docsBase:
    'https://raw.githubusercontent.com/ClickHouse/ClickHouse/master/docs/en/operations/system-tables',
} as const

/**
 * Output directory for generated docs
 */
export const DEFAULT_OUTPUT_DIR = 'docs/clickhouse-schemas'

/**
 * Known column additions by version (seed data for common changes)
 * This helps when changelog parsing is incomplete
 */
export const KNOWN_COLUMN_CHANGES: Record<
  string,
  Array<{
    table: string
    column: string
    type: string
    changeType: 'added' | 'removed'
  }>
> = {
  '24.1': [
    {
      table: 'system.query_log',
      column: 'query_cache_usage',
      type: 'Enum8',
      changeType: 'added',
    },
    {
      table: 'system.processes',
      column: 'peak_threads_usage',
      type: 'UInt64',
      changeType: 'added',
    },
  ],
  '23.8': [
    // Add known changes for 23.8
  ],
}
