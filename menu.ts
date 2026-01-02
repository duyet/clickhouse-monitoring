import {
  ArchiveIcon,
  BarChartIcon,
  CopyIcon,
  CounterClockwiseClockIcon,
  CrossCircledIcon,
  DashboardIcon,
  ExclamationTriangleIcon,
  GearIcon,
  HomeIcon,
  InfoCircledIcon,
  LightningBoltIcon,
  MixIcon,
  ShuffleIcon,
  TableIcon,
  TextAlignBottomIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'
import {
  BookOpenIcon,
  CircleDollarSignIcon,
  CombineIcon,
  CpuIcon,
  DatabaseZapIcon,
  FilePlus2Icon,
  Grid2x2CheckIcon,
  HardDriveIcon,
  KeyIcon,
  RollerCoasterIcon,
  ScrollTextIcon,
  ShieldAlertIcon,
  ShieldIcon,
  UngroupIcon,
  UnplugIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react'

import type { MenuItem } from '@/components/menu/types'

export const menuItemsConfig: MenuItem[] = [
  {
    title: 'Overview',
    href: '/overview',
    icon: HomeIcon,
    section: 'main',
  },
  {
    title: 'Queries',
    href: '',
    countKey: 'running-queries',
    icon: MixIcon,
    section: 'main',
    items: [
      {
        title: 'Running Queries',
        href: '/running-queries',
        description: 'Queries that are currently running',
        countKey: 'running-queries',
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
        href: '/charts?name=new-parts-created',
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
      {
        title: 'Thread Analysis',
        href: '/queries/thread-analysis',
        description: 'Per-thread query execution statistics',
        icon: CpuIcon,
      },
      {
        title: 'Parallelization',
        href: '/queries/parallelization',
        description: 'Query parallelization efficiency analysis',
        icon: ZapIcon,
      },
    ],
  },
  {
    title: 'Tables',
    href: '/tables',
    icon: TableIcon,
    section: 'main',
    items: [
      {
        title: 'Database Explorer',
        href: '/explorer',
        description: 'Explore databases, tables, and their structure',
        icon: TableIcon,
      },
      {
        title: 'Tables Explorer',
        href: '/table',
        countKey: 'tables-explorer',
        description: 'List of databases, tables and their details',
        icon: TableIcon,
      },
      {
        title: 'Tables Overview',
        href: '/tables-overview',
        countKey: 'tables-overview',
        description: 'Overview of all tables and their parts',
        icon: Grid2x2CheckIcon,
      },
      {
        title: 'Distributed DDL Queue',
        href: '/distributed-ddl-queue',
        countKey: 'distributed-ddl-queue',
        description:
          'Distributed ddl queries (ON CLUSTER clause) that were executed on a cluster',
        icon: ShuffleIcon,
      },
      {
        title: 'Table Replicas',
        href: '/replicas',
        description:
          'Contains information and status for replicated tables residing on the local server',
        countKey: 'table-replicas',
        icon: CopyIcon,
      },
      {
        title: 'Replication Queue',
        href: '/replication-queue',
        description:
          'Contains information about tasks from replication queues stored in ClickHouse Keeper, or ZooKeeper, for tables in the ReplicatedMergeTree family',
        countKey: 'replication-queue',
        icon: ShuffleIcon,
      },
      {
        title: 'Readonly Tables',
        href: '/readonly-tables',
        description: 'Readonly tables and their replicas',
        countKey: 'readonly-tables',
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
        countKey: 'view-refreshes',
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
    title: 'Merges',
    href: '/merges',
    countKey: 'merges',
    icon: CombineIcon,
    section: 'main',
    items: [
      {
        title: 'Merges',
        href: '/merges',
        description:
          'Merges and part mutations currently in process for tables in the MergeTree family',
        countKey: 'merges',
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
    title: 'Monitoring',
    href: '',
    icon: BarChartIcon,
    section: 'main',
    items: [
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
        title: 'Page Views',
        href: '/page-views',
        description: 'Self-analytics page views',
        icon: BarChartIcon,
      },
      {
        title: 'Profiler',
        href: '/profiler',
        description: 'Query processor profiling data',
        icon: CpuIcon,
      },
      {
        title: 'Dictionaries',
        href: '/dictionaries',
        description: 'External dictionaries loaded in ClickHouse',
        icon: BookOpenIcon,
      },
    ],
  },
  {
    title: 'Security',
    href: '',
    icon: ShieldIcon,
    section: 'others',
    items: [
      {
        title: 'Sessions',
        href: '/security/sessions',
        description: 'Active and historical user sessions',
        icon: UsersIcon,
      },
      {
        title: 'Login Attempts',
        href: '/security/login-attempts',
        description: 'Login success and failure tracking',
        icon: KeyIcon,
      },
      {
        title: 'Audit Log',
        href: '/security/audit-log',
        description: 'Security event timeline',
        icon: ShieldIcon,
      },
    ],
  },
  {
    title: 'Logs',
    href: '',
    icon: ScrollTextIcon,
    section: 'others',
    items: [
      {
        title: 'Text Log',
        href: '/logs/text-log',
        description: 'Server log messages for debugging',
        icon: ScrollTextIcon,
      },
      {
        title: 'Stack Traces',
        href: '/logs/stack-traces',
        description: 'Current stack traces for all server threads',
        icon: ScrollTextIcon,
      },
      {
        title: 'Crashes',
        href: '/logs/crashes',
        description: 'Server crash history and details',
        icon: ShieldAlertIcon,
      },
    ],
  },
  {
    title: 'System',
    href: '',
    icon: GearIcon,
    section: 'others',
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
        countKey: 'disks',
        icon: HardDriveIcon,
      },
    ],
  },
  {
    title: 'Cluster',
    href: '',
    icon: UngroupIcon,
    section: 'others',
    items: [
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
        href: '/charts?name=connections-http,connections-interserver',
        description: 'Number of connections over time',
        icon: UnplugIcon,
      },
    ],
  },
  {
    title: 'Operations',
    href: '',
    icon: ArchiveIcon,
    section: 'others',
    items: [
      {
        title: 'Backups',
        href: '/backups',
        description:
          'Backups and restores tables and databases. The information is taken from the system.backup_log table',
        countKey: 'backups',
        icon: ArchiveIcon,
      },
      {
        title: 'Errors',
        href: '/errors',
        description: 'System error logs and history',
        icon: ShieldAlertIcon,
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
