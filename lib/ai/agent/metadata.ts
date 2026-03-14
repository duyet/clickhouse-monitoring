/**
 * Client-side tool metadata for display in the AI Agents sidebar.
 *
 * This file contains only display information (names, descriptions, categories)
 * without importing the actual tool functions which depend on server-side code.
 */

export interface ToolMetadata {
  readonly name: string
  readonly description: string
  readonly category:
    | 'schema'
    | 'query'
    | 'health'
    | 'storage'
    | 'replication'
    | 'security'
    | 'cluster'
    | 'merge'
    | 'control'
    | 'dashboard'
    | 'settings'
    | 'logs'
    | 'system'
}

export const TOOLS_METADATA: readonly ToolMetadata[] = [
  // Schema tools
  {
    name: 'query',
    description: 'Execute a read-only SQL query against ClickHouse',
    category: 'schema',
  },
  {
    name: 'list_databases',
    description: 'List all databases in the ClickHouse cluster',
    category: 'schema',
  },
  {
    name: 'list_tables',
    description: 'List all tables in a database with sizes',
    category: 'schema',
  },
  {
    name: 'get_table_schema',
    description: 'Get column definitions for a specific table',
    category: 'schema',
  },
  {
    name: 'explore_table_schema',
    description: 'Comprehensive schema exploration with relationship discovery',
    category: 'schema',
  },

  // Query analysis tools
  {
    name: 'get_running_queries',
    description: 'List currently running queries',
    category: 'query',
  },
  {
    name: 'get_slow_queries',
    description: 'Get slowest completed queries from query log',
    category: 'query',
  },
  {
    name: 'get_failed_queries',
    description: 'Recent failed queries with error details',
    category: 'query',
  },
  {
    name: 'get_expensive_queries',
    description: 'Top queries by memory, read bytes, or duration',
    category: 'query',
  },
  {
    name: 'get_query_patterns',
    description: 'Aggregated query fingerprints with frequency and resources',
    category: 'query',
  },
  {
    name: 'explain_query',
    description: 'EXPLAIN plan/pipeline/indexes for a query',
    category: 'query',
  },

  // System health tools
  {
    name: 'get_metrics',
    description: 'Server version, uptime, connections, and memory',
    category: 'health',
  },
  {
    name: 'get_system_resources',
    description: 'CPU, memory, disk, network, and thread metrics',
    category: 'health',
  },
  {
    name: 'get_disk_usage',
    description: 'Per-disk space: free, total, and used percentage',
    category: 'health',
  },
  {
    name: 'get_errors',
    description: 'Recent system errors with counts',
    category: 'health',
  },
  {
    name: 'get_crash_log',
    description: 'Server crash history',
    category: 'health',
  },

  // Storage tools
  {
    name: 'get_table_parts',
    description: 'Part-level sizes, rows, and compression ratios',
    category: 'storage',
  },
  {
    name: 'get_detached_parts',
    description: 'Detached parts needing attention',
    category: 'storage',
  },
  {
    name: 'get_top_tables_by_size',
    description: 'Top tables by compressed size',
    category: 'storage',
  },

  // Replication tools
  {
    name: 'get_replication_status',
    description: 'Per-table replication lag, queue size, and status',
    category: 'replication',
  },
  {
    name: 'get_replication_queue',
    description: 'Pending replication tasks',
    category: 'replication',
  },

  // Security tools
  {
    name: 'get_active_sessions',
    description: 'Current sessions with user and client info',
    category: 'security',
  },
  {
    name: 'get_login_attempts',
    description: 'Recent login successes and failures',
    category: 'security',
  },
  {
    name: 'get_users_and_roles',
    description: 'Users, roles, and access grants',
    category: 'security',
  },

  // Cluster tools
  {
    name: 'get_clusters',
    description: 'Cluster topology: shards, replicas, and hosts',
    category: 'cluster',
  },
  {
    name: 'get_distributed_ddl_queue',
    description: 'Pending or failed distributed DDL operations',
    category: 'cluster',
  },

  // Merge tools
  {
    name: 'get_merge_status',
    description: 'Active merge operations with progress',
    category: 'merge',
  },
  {
    name: 'get_mutations',
    description: 'Pending and stuck mutations',
    category: 'merge',
  },
  {
    name: 'get_merge_performance',
    description: 'Historical merge throughput',
    category: 'merge',
  },

  // Control tools (destructive)
  {
    name: 'kill_query',
    description: 'Kill a running query by ID (destructive)',
    category: 'control',
  },
  {
    name: 'optimize_table',
    description: 'Trigger OPTIMIZE TABLE (destructive)',
    category: 'control',
  },
  {
    name: 'kill_mutation',
    description: 'Cancel a stuck mutation (destructive)',
    category: 'control',
  },

  // Dashboard tools
  {
    name: 'get_dashboard_pages',
    description: 'List all available dashboard pages',
    category: 'dashboard',
  },
  {
    name: 'get_chart_data',
    description: 'Fetch data from a specific chart',
    category: 'dashboard',
  },

  // Settings tools
  {
    name: 'get_settings',
    description: 'Server settings changed from defaults',
    category: 'settings',
  },
  {
    name: 'get_mergetree_settings',
    description: 'MergeTree engine settings changed from defaults',
    category: 'settings',
  },

  // Log tools
  {
    name: 'get_text_log',
    description: 'Server log entries filtered by level and pattern',
    category: 'logs',
  },
  {
    name: 'get_stack_traces',
    description: 'Current thread stack traces',
    category: 'logs',
  },

  // System tools
  {
    name: 'get_zookeeper_info',
    description: 'ZooKeeper node data and children',
    category: 'system',
  },
  {
    name: 'load_skill',
    description:
      'Load specialized knowledge (best practices, optimization guides)',
    category: 'system',
  },
] as const

export interface ToolCategory {
  readonly name: string
  readonly tools: readonly string[]
  readonly icon: string
}

export const TOOL_CATEGORIES: readonly ToolCategory[] = [
  {
    name: 'Schema',
    tools: [
      'query',
      'list_databases',
      'list_tables',
      'get_table_schema',
      'explore_table_schema',
    ],
    icon: '📊',
  },
  {
    name: 'Query Analysis',
    tools: [
      'get_running_queries',
      'get_slow_queries',
      'get_failed_queries',
      'get_expensive_queries',
      'get_query_patterns',
      'explain_query',
    ],
    icon: '🔍',
  },
  {
    name: 'Health',
    tools: [
      'get_metrics',
      'get_system_resources',
      'get_disk_usage',
      'get_errors',
      'get_crash_log',
    ],
    icon: '💓',
  },
  {
    name: 'Storage',
    tools: ['get_table_parts', 'get_detached_parts', 'get_top_tables_by_size'],
    icon: '💾',
  },
  {
    name: 'Replication',
    tools: ['get_replication_status', 'get_replication_queue'],
    icon: '🔄',
  },
  {
    name: 'Security',
    tools: ['get_active_sessions', 'get_login_attempts', 'get_users_and_roles'],
    icon: '🛡️',
  },
  {
    name: 'Cluster',
    tools: ['get_clusters', 'get_distributed_ddl_queue'],
    icon: '🌐',
  },
  {
    name: 'Merges',
    tools: ['get_merge_status', 'get_mutations', 'get_merge_performance'],
    icon: '🔀',
  },
  {
    name: 'Control',
    tools: ['kill_query', 'optimize_table', 'kill_mutation'],
    icon: '⚡',
  },
  {
    name: 'Dashboard',
    tools: ['get_dashboard_pages', 'get_chart_data'],
    icon: '📈',
  },
  {
    name: 'Settings',
    tools: ['get_settings', 'get_mergetree_settings'],
    icon: '⚙️',
  },
  {
    name: 'Logs',
    tools: ['get_text_log', 'get_stack_traces'],
    icon: '📜',
  },
  {
    name: 'System',
    tools: ['get_zookeeper_info', 'load_skill'],
    icon: '🔧',
  },
] as const

export const SUGGESTED_PROMPTS = [
  'What databases are available and which ones have the most tables?',
  'Show me the 10 largest tables and their disk usage',
  'Which queries are running right now and how long have they been executing?',
  'What are the slowest queries from the past 24 hours?',
  'Show me failed queries from the last hour',
  'How is the merge queue performing? Are there any large merges stuck?',
  'What is the current CPU, memory, and disk usage of this server?',
  'Show me replication lag across all replica tables',
  'Are there any stuck mutations?',
  'What are the most frequently run query patterns?',
  'Show me active sessions and who is connected',
  'What server settings have been changed from defaults?',
] as const

/**
 * Get tool metadata by name
 */
export function getToolMetadata(name: string): ToolMetadata | undefined {
  return TOOLS_METADATA.find((tool) => tool.name === name)
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolMetadata['category']) {
  return TOOLS_METADATA.filter((tool) => tool.category === category)
}
