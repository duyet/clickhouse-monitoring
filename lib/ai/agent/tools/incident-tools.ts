import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

/**
 * Validate and sanitize the INTERVAL value to prevent SQL injection.
 * Only allows patterns like "1 HOUR", "30 MINUTE", "2 DAY".
 */
function sanitizeInterval(value: string): string {
  const normalized = value.trim().toUpperCase()
  const match = normalized.match(
    /^(\d{1,4})\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH)S?$/
  )
  if (!match) {
    throw new Error(
      `Invalid interval: "${value}". Use format like "1 HOUR", "30 MINUTE", "2 DAY".`
    )
  }
  return `${match[1]} ${match[2]}`
}

const SYMPTOM_QUERIES: Record<
  string,
  { label: string; queries: Array<{ name: string; sql: string }> }
> = {
  slow_queries: {
    label: 'Slow Query Investigation',
    queries: [
      {
        name: 'current_slow',
        sql: `SELECT query_id, user, elapsed, read_rows, memory_usage, substring(query, 1, 200) as query_preview FROM system.processes WHERE elapsed > 10 ORDER BY elapsed DESC`,
      },
      {
        name: 'recent_slow',
        sql: `SELECT toStartOfMinute(event_time) as minute, count() as count, avg(query_duration_ms) as avg_ms, max(query_duration_ms) as max_ms FROM system.query_log WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL {since} GROUP BY minute ORDER BY minute`,
      },
      {
        name: 'concurrent_merges',
        sql: `SELECT count() as active_merges, formatReadableSize(sum(total_size_bytes_compressed)) as merge_size FROM system.merges`,
      },
    ],
  },
  high_errors: {
    label: 'Error Spike Investigation',
    queries: [
      {
        name: 'error_timeline',
        sql: `SELECT toStartOfMinute(event_time) as minute, count() as errors, any(exception_code) as sample_code, any(substring(exception, 1, 200)) as sample_error FROM system.query_log WHERE type = 'ExceptionWhileProcessing' AND event_time > now() - INTERVAL {since} GROUP BY minute ORDER BY minute`,
      },
      {
        name: 'top_errors',
        sql: `SELECT exception_code, count() as count, any(substring(exception, 1, 300)) as sample_message FROM system.query_log WHERE type = 'ExceptionWhileProcessing' AND event_time > now() - INTERVAL {since} GROUP BY exception_code ORDER BY count DESC LIMIT 5`,
      },
      {
        name: 'system_errors',
        sql: `SELECT name, code, value, last_error_time, substring(last_error_message, 1, 200) as message FROM system.errors WHERE value > 0 ORDER BY last_error_time DESC LIMIT 10`,
      },
    ],
  },
  replication_lag: {
    label: 'Replication Lag Investigation',
    queries: [
      {
        name: 'replica_status',
        sql: `SELECT database, table, is_leader, is_readonly, absolute_delay, queue_size, inserts_in_queue, merges_in_queue FROM system.replicas ORDER BY absolute_delay DESC`,
      },
      {
        name: 'replication_queue',
        sql: `SELECT database, table, type, create_time, source_replica, num_tries, last_exception FROM system.replication_queue ORDER BY create_time LIMIT 20`,
      },
      {
        name: 'zookeeper_check',
        sql: `SELECT count() as zk_nodes FROM system.zookeeper WHERE path = '/'`,
      },
    ],
  },
  high_memory: {
    label: 'Memory Pressure Investigation',
    queries: [
      {
        name: 'memory_consumers',
        sql: `SELECT query_id, user, memory_usage, elapsed, read_rows, substring(query, 1, 200) as query_preview FROM system.processes ORDER BY memory_usage DESC LIMIT 10`,
      },
      {
        name: 'memory_metrics',
        sql: `SELECT metric, value FROM system.metrics WHERE metric IN ('MemoryTracking', 'MemoryResident')`,
      },
      {
        name: 'recent_oom',
        sql: `SELECT event_time, substring(message, 1, 500) as message FROM system.text_log WHERE message LIKE '%Memory limit%' AND event_time > now() - INTERVAL {since} ORDER BY event_time DESC LIMIT 5`,
      },
    ],
  },
  too_many_parts: {
    label: 'Too Many Parts Investigation',
    queries: [
      {
        name: 'high_part_tables',
        sql: `SELECT database, table, count() as parts, formatReadableSize(sum(bytes_on_disk)) as size FROM system.parts WHERE active GROUP BY database, table HAVING parts > 300 ORDER BY parts DESC LIMIT 10`,
      },
      {
        name: 'stuck_mutations',
        sql: `SELECT database, table, mutation_id, command, create_time, parts_to_do FROM system.mutations WHERE is_done = 0 ORDER BY create_time LIMIT 10`,
      },
      {
        name: 'merge_activity',
        sql: `SELECT count() as active_merges, formatReadableSize(sum(total_size_bytes_compressed)) as total_size FROM system.merges`,
      },
    ],
  },
}

const COMMON_CONTEXT_QUERIES = [
  {
    name: 'recent_ddl',
    sql: `SELECT event_time, user, substring(query, 1, 300) as query_preview, query_duration_ms FROM system.query_log WHERE query_kind = 'DDL' AND event_time > now() - INTERVAL {since} ORDER BY event_time DESC LIMIT 5`,
  },
  {
    name: 'server_load',
    sql: `SELECT metric, value FROM system.metrics WHERE metric IN ('TCPConnection', 'HTTPConnection', 'MemoryTracking', 'Query', 'Merge')`,
  },
]

export function createIncidentTools(hostId: number) {
  return {
    investigate_incident: dynamicTool({
      description:
        'Automated incident investigation and root cause analysis. Given a symptom type, runs targeted diagnostic queries to identify the root cause. Correlates events from query_log, system errors, merge activity, and DDL changes. Returns a timeline and findings. Use when users report issues or ask "why is X happening?".',
      inputSchema: z.object({
        symptom: z
          .enum([
            'slow_queries',
            'high_errors',
            'replication_lag',
            'high_memory',
            'too_many_parts',
          ])
          .describe('Type of symptom to investigate'),
        since: z
          .string()
          .optional()
          .default('1 HOUR')
          .describe('Time window, e.g. "2 HOUR", "30 MINUTE"'),
        hostId: z.number().int().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const {
          symptom,
          since = '1 HOUR',
          hostId: toolHostId,
        } = input as {
          symptom: keyof typeof SYMPTOM_QUERIES
          since?: string
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)

        let sanitized: string
        try {
          sanitized = sanitizeInterval(since)
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) }
        }

        const config = SYMPTOM_QUERIES[symptom]
        if (!config) {
          return { error: `Unknown symptom: ${symptom}` }
        }

        const allQueries = [...config.queries, ...COMMON_CONTEXT_QUERIES]

        const results = await Promise.all(
          allQueries.map(async (q) => {
            try {
              const sql = q.sql.replace(/\{since\}/g, sanitized)
              const data = await readOnlyQuery({ query: sql, hostId: resolved })
              return { name: q.name, data }
            } catch (e) {
              return {
                name: q.name,
                error: e instanceof Error ? e.message : String(e),
              }
            }
          })
        )

        const findings: Record<string, unknown> = {}
        for (const r of results) {
          findings[r.name] = 'error' in r ? { error: r.error } : r.data
        }

        return {
          investigation: config.label,
          symptom,
          time_window: sanitized,
          investigated_at: new Date().toISOString(),
          findings,
          instructions: `Analyze these findings for the "${config.label}" investigation. Create a timeline of events, identify the most likely root cause, and recommend specific actions to resolve the issue.`,
        }
      },
    }),
  }
}
