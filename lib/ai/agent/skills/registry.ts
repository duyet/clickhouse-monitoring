/**
 * Auto-generated skills registry.
 * Run `bun run build:skills` to regenerate from .agents/skills/
 *
 * DO NOT EDIT MANUALLY
 */

import type { Skill } from './types'

const SKILLS: readonly Skill[] = [
  {
    name: 'clickhouse-best-practices',
    description:
      'ClickHouse schema design, query optimization, and operational best practices for production deployments.',
    content: `# ClickHouse Best Practices

## When to use this skill
Load this skill when users ask about:
- Table engine selection and design
- Query optimization strategies
- Schema design best practices
- Partition and index strategies
- Performance tuning
- Data type selection
- Merge tree family best practices

## Schema Design

### Partition Key Selection
- Partition by month (\`toYYYYMM(event_time)\`) for most time-series data
- Keep partitions under 1000 per table
- Use partition for data lifecycle (TTL, DROP PARTITION)
- Never partition by high-cardinality columns

### Sorting Key Design
- Put most-filtered columns first in ORDER BY
- Time column usually goes last (for range scans within filtered data)
- Keep sorting key under 4-5 columns
- Example: \`ORDER BY (tenant_id, event_type, event_time)\`

### Primary Key
- Can be prefix of sorting key for larger granules
- Default: same as sorting key
- Shorter primary key = less memory for index

## Query Optimization

### Use PREWHERE
- Moves filter to before column reads
- Best for filtering on columns not in SELECT
- ClickHouse auto-promotes WHERE to PREWHERE for simple conditions

### Avoid SELECT *
- Column-oriented storage means each column = separate read
- Only select needed columns
- Use \`COLUMNS('pattern')\` for regex column selection

### SAMPLE for Large Tables
- \`SAMPLE 0.1\` reads ~10% of data randomly
- Good for approximate aggregations on huge tables
- Not suitable for exact counts or small result sets

### JOIN Best Practices
- Put smaller table on the RIGHT side of JOIN
- Use \`IN\` subquery instead of JOIN for simple lookups
- Filter both sides before joining
- Consider \`GLOBAL JOIN\` for distributed queries

## Data Type Best Practices

### Use LowCardinality
- For string columns with < 10,000 distinct values
- 5-10x compression improvement
- Faster GROUP BY and filtering

### Avoid Nullable When Possible
- Nullable adds 1 byte overhead per row
- Use default values (0, empty string) instead
- Nullable disables some optimizations

### DateTime Precision
- \`Date\` (2 bytes) for date-only fields
- \`DateTime\` (4 bytes) for second precision
- \`DateTime64(3)\` (8 bytes) only when milliseconds needed

## Operational Best Practices

### Monitoring Queries
- Check \`system.merges\` for background merge health
- Monitor \`system.mutations\` for stuck mutations
- Use \`system.query_log\` with \`type = 'QueryFinish'\` for performance analysis
- Watch \`system.replicas\` for replication lag

### TTL Management
- Set TTL at table level: \`TTL event_time + INTERVAL 90 DAY\`
- Use tiered storage: \`TTL ... TO VOLUME 'cold'\`
- Monitor TTL merges in \`system.merges\`

### Insert Best Practices
- Batch inserts: 10,000-100,000 rows per batch
- Avoid small frequent inserts (< 1000 rows)
- Use async inserts for high-frequency small writes
- Max 1-2 inserts per second per table`,
  },
]

/** Get all available skills metadata (without content) */
export function getSkillsMetadata(): ReadonlyArray<{
  name: string
  description: string
}> {
  return SKILLS.map(({ name, description }) => ({
    name,
    description,
  }))
}

/** Load a skill by name, returns null if not found */
export function loadSkillContent(name: string): Skill | null {
  return SKILLS.find((s) => s.name === name) ?? null
}
