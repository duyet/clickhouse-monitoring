/**
 * Menu count registry that maps count keys to their SQL queries.
 * This centralizes all menu count queries on the server side,
 * preventing SQL from being sent from the frontend.
 *
 * SECURITY: Only whitelisted count keys are allowed.
 * Clients send a countKey, not raw SQL.
 */

import { QUERY_COMMENT } from '@/lib/clickhouse'

export interface MenuCountQuery {
  query: string
  optional?: boolean
  tableCheck?: string
}

/**
 * Registry of menu count queries.
 * Keys match the countKey in menu.ts MenuItem definitions.
 */
export const menuCountRegistry: Record<string, MenuCountQuery> = {
  // Tables menu
  'tables-explorer': {
    query: `SELECT COUNT() as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema') AND is_temporary = 0 AND engine LIKE '%MergeTree%'`,
  },
  'tables-overview': {
    query: `SELECT countDistinct(database || table) as count FROM system.parts`,
  },
  'distributed-ddl-queue': {
    query: `SELECT COUNT() as count FROM system.distributed_ddl_queue WHERE status != 'Finished'`,
  },
  'table-replicas': {
    query: `SELECT COUNT() as count FROM system.replicas`,
  },
  'replication-queue': {
    query: `SELECT COUNT() as count FROM system.replication_queue`,
  },
  'readonly-tables': {
    query: `SELECT COUNT() as count FROM system.replicas WHERE is_readonly = 1`,
  },
  'view-refreshes': {
    query: `SELECT COUNT() as count FROM system.view_refreshes`,
  },

  // Queries menu
  'running-queries': {
    query: `SELECT COUNT() as count FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
  },

  // Merges menu
  merges: {
    query: `SELECT COUNT() as count FROM system.merges WHERE 1 = 1`,
  },

  // More menu
  disks: {
    query: `SELECT COUNT() as count FROM system.disks`,
  },
  backups: {
    query: `SELECT COUNT() as count FROM system.backup_log WHERE status = 'BACKUP_CREATED'`,
    optional: true,
    tableCheck: 'system.backup_log',
  },
}

/**
 * Get a menu count query by key
 */
export function getMenuCountQuery(countKey: string): MenuCountQuery | null {
  return menuCountRegistry[countKey] || null
}

/**
 * Check if a count key exists in the registry
 */
export function hasMenuCountKey(countKey: string): boolean {
  return countKey in menuCountRegistry
}

/**
 * Get all available count keys
 */
export function getAvailableMenuCountKeys(): string[] {
  return Object.keys(menuCountRegistry)
}
