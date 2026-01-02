/**
 * Table guidance configuration
 *
 * Maps ClickHouse system table names to enable instructions and documentation links.
 * Used to provide helpful guidance when optional tables are not available.
 */

export interface TableGuidance {
  /** How to enable this table in ClickHouse */
  enableInstructions: string
  /** Link to official ClickHouse documentation */
  docsUrl?: string
  /** Short description of what this table provides */
  description?: string
}

/**
 * Guidance for optional ClickHouse system tables
 */
export const TABLE_GUIDANCE: Record<string, TableGuidance> = {
  'system.query_thread_log': {
    description: 'Per-thread query execution statistics',
    enableInstructions:
      'Enable by setting `log_query_threads = 1` in your ClickHouse config or per-query.',
    docsUrl:
      'https://clickhouse.com/docs/en/operations/system-tables/query_thread_log',
  },
  'system.session_log': {
    description: 'Login attempts and session tracking',
    enableInstructions:
      'Enable by adding the `<session_log>` section to your ClickHouse server config.',
    docsUrl:
      'https://clickhouse.com/docs/en/operations/system-tables/session_log',
  },
  'system.processors_profile_log': {
    description: 'Query processor profiling data',
    enableInstructions:
      'Enable by setting `log_processors_profiles = 1` in your ClickHouse config.',
    docsUrl:
      'https://clickhouse.com/docs/en/operations/system-tables/processors_profile_log',
  },
  'system.error_log': {
    description: 'System error history',
    enableInstructions:
      'Enable by adding the `<error_log>` section to your ClickHouse server config.',
    docsUrl:
      'https://clickhouse.com/docs/en/operations/system-tables/error_log',
  },
  'system.zookeeper': {
    description: 'ZooKeeper/Keeper cluster coordination data',
    enableInstructions:
      'This table is only available when ZooKeeper or ClickHouse Keeper is configured for your cluster.',
    docsUrl: 'https://clickhouse.com/docs/en/operations/system-tables/zookeeper',
  },
  'system.backup_log': {
    description: 'Backup operation history',
    enableInstructions:
      'This table is created after running your first BACKUP command. Run a backup to enable this feature.',
    docsUrl: 'https://clickhouse.com/docs/en/operations/backup',
  },
  'system.text_log': {
    description: 'Server log messages',
    enableInstructions:
      'The system.text_log table is not enabled in your ClickHouse configuration. To enable it, add the following to your config.xml or create a new file in config.d/:' +
      '\n\n```xml\n<text_log>\n  <database>system</database>\n  <table>text_log</table>\n  <flush_interval_milliseconds>7500</flush_interval_milliseconds>\n</text_log>\n```\n\n' +
      'After adding the configuration, restart your ClickHouse server.',
    docsUrl: 'https://clickhouse.com/docs/en/operations/system-tables/text_log',
  },
  'system.crash_log': {
    description: 'Server crash history',
    enableInstructions:
      'The system.crash_log table is not present on this ClickHouse cluster. This table is automatically created by ClickHouse when server crashes occur. If no crashes have been logged yet, this table may not exist. This is normal for healthy clusters with no crash history. The table will be created automatically when the first crash is detected.',
    docsUrl: 'https://clickhouse.com/docs/en/operations/system-tables/crash_log',
  },
  'system.monitoring_events': {
    description: 'Custom monitoring events table',
    enableInstructions:
      'This is a custom table created by the monitoring application. It will be available after the first page view is tracked.',
  },
}

/**
 * Get guidance for a specific table
 */
export function getTableGuidance(tableName: string): TableGuidance | undefined {
  return TABLE_GUIDANCE[tableName]
}

/**
 * Get guidance for an array of missing tables
 * Returns the first table's guidance if multiple are missing
 */
export function getGuidanceForMissingTables(
  tables: readonly string[]
): TableGuidance | undefined {
  for (const table of tables) {
    const guidance = getTableGuidance(table)
    if (guidance) {
      return guidance
    }
  }
  return undefined
}
