import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'

export function registerPrompts(server: McpServer) {
  server.prompt(
    'health-check',
    'Run a comprehensive ClickHouse health check',
    {
      hostId: z.string().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Perform a health check on ClickHouse host ${hostId ?? '0'}:
1. Get server metrics (version, uptime, connections)
2. Check disk usage and warn if any disk is >80% full
3. List any currently running queries taking >30s
4. Check for stuck mutations
5. Report replication lag if replicated tables exist
Summarize findings with severity levels (OK/WARNING/CRITICAL).`,
          },
        },
      ],
    })
  )

  server.prompt(
    'slow-query-analysis',
    'Analyze slow queries and suggest optimizations',
    {
      hostId: z.string().optional().describe('Host index (default: 0)'),
      lastHours: z
        .string()
        .optional()
        .describe('Number of hours to look back (default: 24)'),
    },
    async ({ hostId, lastHours }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Analyze slow queries on ClickHouse host ${hostId ?? '0'} from the last ${lastHours ?? '24'} hours:
1. Get the top 10 slowest queries by duration from system.query_log
2. Identify repeated query patterns (similar fingerprints appearing >5 times)
3. For each slow pattern, check if the target tables have appropriate indexes
4. Look for queries scanning >1M rows that return <100 rows (missing index signals)
5. Check for queries with high memory usage (>1GB)
Provide optimization suggestions for the top 3 most impactful patterns.`,
          },
        },
      ],
    })
  )

  server.prompt(
    'storage-audit',
    'Audit storage usage, part health, and compression',
    {
      hostId: z.string().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Audit storage on ClickHouse host ${hostId ?? '0'}:
1. Check disk usage across all disks and warn if any is >80% full
2. List the top 10 tables by total size (compressed and uncompressed)
3. Calculate compression ratios for the largest tables
4. Identify tables with >300 active parts (part count health)
5. Find tables with parts older than 30 days that haven't been merged
6. Check for any detached parts that may need cleanup
Summarize with storage efficiency score and recommended actions.`,
          },
        },
      ],
    })
  )

  server.prompt(
    'replication-check',
    'Check replication health across replicated tables',
    {
      hostId: z.string().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Check replication health on ClickHouse host ${hostId ?? '0'}:
1. List all replicated tables with their replication status
2. Check for any readonly replicas (is_readonly = 1)
3. Report replication lag (absolute_delay) and warn if >300 seconds
4. Check replication queue depth (queue_size, inserts_in_queue, merges_in_queue)
5. Verify leader election status across replicas
6. Look for any replication errors in recent logs
Summarize replication health with severity levels (OK/WARNING/CRITICAL).`,
          },
        },
      ],
    })
  )

  server.prompt(
    'capacity-report',
    'Analyze capacity trends and project future needs',
    {
      hostId: z.string().optional().describe('Host index (default: 0)'),
      lastDays: z
        .string()
        .optional()
        .describe('Number of days to analyze (default: 30)'),
    },
    async ({ hostId, lastDays }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Generate a capacity report for ClickHouse host ${hostId ?? '0'} covering the last ${lastDays ?? '30'} days:
1. Get current disk usage and total capacity
2. Analyze storage growth by checking table sizes over time
3. Check query volume trends from system.query_log (queries per hour/day)
4. Measure peak memory usage and connection counts
5. Identify the fastest-growing tables by row count and byte size
6. Project when current storage will reach 80% based on growth rate
Provide a capacity summary with projected dates for resource thresholds.`,
          },
        },
      ],
    })
  )
}
