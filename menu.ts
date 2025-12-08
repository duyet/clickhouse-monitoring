import {
  ArchiveIcon,
  BarChartIcon,
  CopyIcon,
  CounterClockwiseClockIcon,
  CrossCircledIcon,
  DashboardIcon,
  ExclamationTriangleIcon,
  GearIcon,
  HamburgerMenuIcon,
  HomeIcon,
  InfoCircledIcon,
  LightningBoltIcon,
  MixIcon,
  ShuffleIcon,
  TableIcon,
  TextAlignBottomIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'

import type { MenuItem } from '@/components/menu/types'
import { QUERY_COMMENT } from '@/lib/clickhouse'
import {
  CircleDollarSignIcon,
  CombineIcon,
  DatabaseZapIcon,
  FilePlus2Icon,
  Grid2x2CheckIcon,
  HardDriveIcon,
  RollerCoasterIcon,
  ShieldAlertIcon,
  UngroupIcon,
  UnplugIcon,
} from 'lucide-react'

export const menuItemsConfig: MenuItem[] = [
  {
    title: 'Overview',
    href: '/overview',
    icon: HomeIcon,
  },
  {
    title: 'Tables',
    href: '/tables',
    icon: TableIcon,
    items: [
      {
        title: 'Tables Explorer',
        href: '/database',
        countSql: `SELECT COUNT() FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema') AND is_temporary = 0 AND engine LIKE '%MergeTree%'`,
        description: 'List of databases, tables and their details',
        icon: TableIcon,
      },
      {
        title: 'Tables Overview',
        href: '/tables-overview',
        countSql:
          'SELECT countDistinct(database || table) as `count()` FROM system.parts',
        description: 'Overview of all tables and their parts',
        icon: Grid2x2CheckIcon,
      },
      {
        title: 'Distributed DDL Queue',
        href: '/distributed-ddl-queue',
        countSql: `SELECT COUNT() FROM system.distributed_ddl_queue WHERE status != 'Finished'`,
        description:
          'Distributed ddl queries (ON CLUSTER clause) that were executed on a cluster',
        icon: ShuffleIcon,
      },
      {
        title: 'Table Replicas',
        href: '/replicas',
        description:
          'Contains information and status for replicated tables residing on the local server',
        countSql: `SELECT COUNT() FROM system.replicas`,
        icon: CopyIcon,
      },
      {
        title: 'Replication Queue',
        href: '/replication-queue',
        description:
          'Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family',
        countSql: `SELECT COUNT() FROM system.replication_queue`,
        icon: ShuffleIcon,
      },
      {
        title: 'Readonly Tables',
        href: '/readonly-tables',
        description: 'Readonly tables and their replicas',
        countSql: `SELECT COUNT() FROM system.replicas WHERE is_readonly = 1`,
        countVariant: 'destructive',
        icon: ExclamationTriangleIcon,
      },
      {
        title: 'Top Usage Tables',
        href: '/top-usage-tables',
        description: 'Most used tables, excluding system tables',
        icon: TextAlignBottomIcon,
      },
      {
        title: 'Projections',
        href: '/projections',
        description:
          'Projections store data in a format that optimizes query execution',
        icon: DatabaseZapIcon,
      },
      {
        title: 'View Refreshes',
        href: '/view-refreshes',
        description:
          "Information about Refreshable Materialized Views. Contains all refreshable materialized views, regardless of whether there's a refresh in progress or not.",
        countSql: `SELECT COUNT() FROM system.view_refreshes`,
        icon: UpdateIcon,
      },
      {
        title: 'Part Info',
        href: '/part-info',
        description:
          'Information about currently table active parts and levels',
        icon: DatabaseZapIcon,
      },
    ],
  },
  {
    title: 'Queries',
    href: '',
    countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
    icon: MixIcon,
    items: [
      {
        title: 'Running Queries',
        href: '/running-queries',
        description: 'Queries that are currently running',
        countSql: `SELECT COUNT() FROM system.processes WHERE is_cancelled = 0 AND query NOT LIKE '%${QUERY_COMMENT}%'`,
        icon: MixIcon,
      },
      {
        title: 'History Queries',
        href: '/history-queries',
        description:
          'Queries that have been run including successed, failed queries with resourses usage details',
        icon: CounterClockwiseClockIcon,
      },
      {
        title: 'Failed Queries',
        href: '/failed-queries',
        description: 'Which queries have failed?',
        icon: CrossCircledIcon,
      },
      {
        title: 'Latest Common Errors',
        href: '/common-errors',
        description:
          'Exploring the system.errors table to see when the error last occurred',
        icon: CrossCircledIcon,
      },
      {
        title: 'Most Expensive Queries',
        href: '/expensive-queries',
        description: 'Most expensive queries by many factors',
        icon: CircleDollarSignIcon,
      },
      {
        title: 'Most Expensive Queries by Memory',
        href: '/expensive-queries-by-memory',
        description: 'Most expensive queries by memory',
        icon: CircleDollarSignIcon,
      },
      {
        title: 'New Parts Created',
        href: '/charts/new-parts-created',
        description: 'How many (and how often) new parts are created',
        icon: FilePlus2Icon,
      },
      {
        title: 'Explain',
        href: '/explain',
        description: 'Shows the execution plan of a statement',
        icon: InfoCircledIcon,
      },
      {
        title: 'Query Cache',
        href: '/query-cache',
        description: 'Query cache usage',
        icon: DatabaseZapIcon,
      },
    ],
  },
  {
    title: 'Merges',
    href: '/merges',
    countSql: `SELECT COUNT() FROM system.merges WHERE 1 = 1`,
    icon: CombineIcon,
    items: [
      {
        title: 'Merges',
        href: '/merges',
        description:
          'Merges and part mutations currently in process for tables in the MergeTree family',
        countSql: `SELECT COUNT() FROM system.merges WHERE 1 = 1`,
        icon: CombineIcon,
      },
      {
        title: 'Merge Performance',
        href: '/merge-performance',
        description: 'Merge performance over day, avg duration, avg rows read',
        icon: LightningBoltIcon,
      },
      {
        title: 'Mutations',
        href: '/mutations',
        description:
          'Information about mutations of MergeTree tables and their progress',
        icon: UpdateIcon,
      },
    ],
  },
  {
    title: 'More',
    href: '',
    icon: HamburgerMenuIcon,
    items: [
      {
        title: 'Settings',
        href: '/settings',
        description:
          'The values of global server settings which can be viewed in the table `system.settings`',
        icon: GearIcon,
      },
      {
        title: 'MergeTree Settings',
        href: '/mergetree-settings',
        description:
          'The values of merge_tree settings (for all MergeTree tables) which can be viewed in the table `system.merge_tree_settings`',
        icon: TableIcon,
      },
      {
        title: 'Disks',
        href: '/disks',
        description:
          'The values of disk settings which can be viewed in the table `system.disks`',
        countSql: `SELECT COUNT() FROM system.disks`,
        icon: HardDriveIcon,
      },
      {
        title: 'Backups',
        href: '/backups',
        description:
          'Backups and restores tables and databases. The information is taken from the system.backup_log table',
        countSql: `SELECT COUNT() FROM system.backup_log WHERE status = 'BACKUP_CREATED'`,
        icon: ArchiveIcon,
      },
      {
        title: 'Metrics',
        href: '/metrics',
        description:
          'Contains metrics which can be calculated instantly, or have a current value',
        icon: BarChartIcon,
      },
      {
        title: 'Asynchronous Metrics',
        href: '/asynchronous-metrics',
        description:
          'Contains metrics that are calculated periodically in the background',
        icon: BarChartIcon,
      },
      {
        title: 'Custom Dashboard',
        href: '/dashboard',
        description:
          'Custom dashboard for monitoring ClickHouse. You can add your own charts and configure them',
        icon: DashboardIcon,
      },
      {
        title: 'Clusters',
        href: '/clusters',
        description:
          'Information about clusters available in the config file and the servers in them',
        icon: UngroupIcon,
      },
      {
        title: 'Zookeeper',
        href: '/zookeeper?path=/',
        description:
          'Exposes data from the Keeper cluster defined in the config',
        icon: RollerCoasterIcon,
      },
      {
        title: 'Connections',
        href: '/charts/connections-http,connections-interserver',
        description: 'Number of connections over time',
        icon: UnplugIcon,
      },
      {
        title: 'Errors',
        href: '/errors',
        description: 'System error logs and history',
        icon: ShieldAlertIcon,
      },
      {
        title: 'Page Views',
        href: '/page-views',
        description: 'Self-analytics page views',
        icon: BarChartIcon,
      },
      {
        title: 'About',
        href: '/about',
        description: 'About dashboard UI and ClickHouse server',
        icon: InfoCircledIcon,
      },
    ],
  },
]
