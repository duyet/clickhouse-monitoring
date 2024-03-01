import { QUERY_COMMENT } from '@/lib/clickhouse'

import { type MenuItem } from './types'

export const menuItemsConfig: MenuItem[] = [
  {
    title: 'Overview',
    href: '/overview',
  },
  {
    title: 'Tables',
    href: '/tables',
    countSql: `SELECT COUNT() FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema') AND is_temporary = 0 AND engine LIKE '%MergeTree%'`,
  },
  {
    title: 'Queries',
    href: '',
    countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
    items: [
      {
        title: 'Running Queries',
        href: '/running-queries',
        description: 'Queries that are currently running',
        countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
      },
      {
        title: 'History Queries',
        href: '/history-queries',
        description:
          'Queries that have been run including successed, failed queries with resourses usage details',
      },
      {
        title: 'Mutations',
        href: '/mutations',
        description:
          'Information about mutations of MergeTree tables and their progress',
        countSql: `SELECT COUNT() FROM system.mutations WHERE is_done = 0`,
      },
      {
        title: 'Failed Queries',
        href: '/failed-queries',
        description: 'Which queries have failed?',
      },
      {
        title: 'Latest Common Errors',
        href: '/common-errors',
        description:
          'Exploring the system.errors table to see when the error last occurred',
      },
      {
        title: 'Most Expensive Queries',
        href: '/expensive-queries',
        description: 'Most expensive queries by many factors',
      },
      {
        title: 'Most Expensive Queries by Memory',
        href: '/expensive-queries-by-memory',
        description: 'Most expensive queries by memory',
      },
      {
        title: 'New Parts Created',
        href: '/charts/new-parts-created',
        description: 'How many (and how often) new parts are created',
      },
    ],
  },
  {
    title: 'Merges',
    href: '/merges',
    countSql: `SELECT COUNT() FROM system.merges WHERE 1 = 1`,
    items: [
      {
        title: 'Merges',
        href: '/merges',
        description:
          'Merges and part mutations currently in process for tables in the MergeTree family',
        countSql: `SELECT COUNT() FROM system.merges WHERE 1 = 1`,
      },
      {
        title: 'Merge Performance',
        href: '/merge-performance',
        description: 'Merge performance over day, avg duration, avg rows read',
      },
    ],
  },
  {
    title: 'More',
    href: '',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        description:
          'The values of global server settings which can be viewed in the table `system.settings`',
      },
      {
        title: 'MergeTree Settings',
        href: '/mergetree-settings',
        description:
          'The values of merge_tree settings (for all MergeTree tables) which can be viewed in the table `system.merge_tree_settings`',
      },
      {
        title: 'Disks',
        href: '/disks',
        description:
          'The values of disk settings which can be viewed in the table `system.disks`',
      },
      {
        title: 'Backups',
        href: '/backups',
        description:
          'Backups and restores tables and databases. The information is taken from the system.backup_log table',
      },
      {
        title: 'Replicas',
        href: '/replicas',
        description:
          'Contains information and status for replicated tables residing on the local server',
        countSql: `SELECT COUNT() FROM system.replicas`,
      },
      {
        title: 'Replication Queue',
        href: '/replication-queue',
        description:
          'Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family',
        countSql: `SELECT COUNT() FROM system.replication_queue`,
      },
      {
        title: 'Metrics',
        href: '/metrics',
        description:
          'Contains metrics which can be calculated instantly, or have a current value',
      },
      {
        title: 'Asynchronous Metrics',
        href: '/asynchronous-metrics',
        description:
          'Contains metrics that are calculated periodically in the background',
      },
      {
        title: 'Custom Dashboard',
        href: '/dashboard',
        description:
          'Custom dashboard for monitoring ClickHouse. You can add your own charts and configure them',
      },
      {
        title: 'Top Usage Tables',
        href: '/top-usage-tables',
        description: 'Most usage tables, ignore system tables (top 50)',
      },
    ],
  },
]
