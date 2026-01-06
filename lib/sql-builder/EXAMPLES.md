# SQL Builder Examples

Comprehensive examples demonstrating the SQL builder API for ClickHouse queries.

## Table of Contents

- [Basic Queries](#basic-queries)
- [WHERE Clauses](#where-clauses)
- [JOINs](#joins)
- [Aggregations](#aggregations)
- [Advanced Features](#advanced-features)
- [ClickHouse Specific](#clickhouse-specific)

## Basic Queries

### Simple SELECT

```typescript
import { sql } from '@/lib/sql-builder'

const query = sql()
  .select('id', 'name', 'email')
  .from('users')
  .build()
// SELECT id, name, email FROM users
```

### SELECT with Alias

```typescript
const query = sql()
  .select('u.id', 'u.name')
  .from('users', 'u')
  .build()
// SELECT u.id, u.name FROM users AS u
```

### Flexible Method Order

```typescript
// Both produce the same output
const q1 = sql().select('*').from('users').build()
const q2 = sql().from('users').select('*').build()
// SELECT * FROM users
```

## WHERE Clauses

### Simple Conditions

```typescript
const query = sql()
  .select('*')
  .from('users')
  .where('age', '>', 18)
  .where('status', '=', 'active')
  .build()
// SELECT * FROM users WHERE age > 18 AND status = 'active'
```

### OR Conditions

```typescript
const query = sql()
  .select('*')
  .from('users')
  .where('role', '=', 'admin')
  .orWhere('role', '=', 'moderator')
  .build()
// SELECT * FROM users WHERE role = 'admin' OR role = 'moderator'
```

### Grouped Conditions

```typescript
const query = sql()
  .select('*')
  .from('users')
  .where('status', '=', 'active')
  .where((q) =>
    q.where('age', '>', 18).orWhere('vip', '=', true)
  )
  .build()
// SELECT * FROM users WHERE status = 'active' AND (age > 18 OR vip = 1)
```

### Raw WHERE Conditions

```typescript
const query = sql()
  .select('*')
  .from('events')
  .whereRaw('timestamp > now() - INTERVAL 1 DAY')
  .build()
// SELECT * FROM events WHERE timestamp > now() - INTERVAL 1 DAY
```

## JOINs

### INNER JOIN

```typescript
const query = sql()
  .select('u.name', 'o.total')
  .from('users', 'u')
  .join('orders', 'o', 'o.user_id = u.id')
  .build()
// SELECT u.name, o.total FROM users AS u INNER JOIN orders AS o ON o.user_id = u.id
```

### LEFT JOIN

```typescript
const query = sql()
  .select('u.name', 'COUNT(o.id)')
  .from('users', 'u')
  .leftJoin('orders', 'o', 'o.user_id = u.id')
  .groupBy('u.name')
  .build()
// SELECT u.name, COUNT(o.id) FROM users AS u LEFT JOIN orders AS o ON o.user_id = u.id GROUP BY u.name
```

### JOIN with USING

```typescript
const query = sql()
  .select('*')
  .from('users', 'u')
  .join('profiles', 'p', { using: ['user_id'] })
  .build()
// SELECT * FROM users AS u INNER JOIN profiles AS p USING (user_id)
```

### Multiple JOINs

```typescript
const query = sql()
  .select('u.name', 'p.bio', 'COUNT(o.id)')
  .from('users', 'u')
  .join('profiles', 'p', { using: ['user_id'] })
  .leftJoin('orders', 'o', 'o.user_id = u.id')
  .groupBy('u.name', 'p.bio')
  .build()
```

## Aggregations

### GROUP BY and COUNT

```typescript
const query = sql()
  .select('user_id', 'COUNT(*)')
  .from('orders')
  .groupBy('user_id')
  .build()
// SELECT user_id, COUNT(*) FROM orders GROUP BY user_id
```

### HAVING Clause

```typescript
const query = sql()
  .select('user_id', 'COUNT(*) as order_count')
  .from('orders')
  .groupBy('user_id')
  .having('COUNT(*)', '>', 10)
  .build()
// SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id HAVING COUNT(*) > 10
```

### Multiple Aggregates

```typescript
const query = sql()
  .select(
    'category',
    'COUNT(*) as total',
    'SUM(amount) as revenue',
    'AVG(amount) as avg_order'
  )
  .from('orders')
  .groupBy('category')
  .orderBy('revenue', 'DESC')
  .build()
```

## Advanced Features

### Common Table Expressions (CTEs)

```typescript
const activeUsers = sql()
  .select('*')
  .from('users')
  .where('status', '=', 'active')

const query = sql()
  .with('active_users', activeUsers)
  .select('COUNT(*)')
  .from('active_users')
  .build()
// WITH active_users AS (SELECT * FROM users WHERE status = 'active') SELECT COUNT(*) FROM active_users
```

### Multiple CTEs

```typescript
const activeUsers = sql()
  .select('*')
  .from('users')
  .where('status', '=', 'active')

const recentOrders = sql()
  .select('*')
  .from('orders')
  .whereRaw('created_at > now() - INTERVAL 7 DAY')

const query = sql()
  .with('active_users', activeUsers)
  .with('recent_orders', recentOrders)
  .select('au.name', 'COUNT(ro.id)')
  .from('active_users', 'au')
  .join('recent_orders', 'ro', 'ro.user_id = au.id')
  .groupBy('au.name')
  .build()
```

### UNION Queries

```typescript
const users = sql()
  .select('id', 'name', 'email')
  .from('users')

const admins = sql()
  .select('id', 'name', 'email')
  .from('admins')

const query = users.union(admins).build()
// SELECT id, name, email FROM users UNION SELECT id, name, email FROM admins
```

### UNION ALL

```typescript
const q1 = sql().select('id').from('users')
const q2 = sql().select('id').from('deleted_users')

const query = q1.unionAll(q2).build()
// SELECT id FROM users UNION ALL SELECT id FROM deleted_users
```

### Subqueries

```typescript
const subquery = sql()
  .select('user_id')
  .from('premium_users')

const query = sql()
  .select('*')
  .from(subquery, 'premium')
  .where('premium.user_id', '>', 1000)
  .build()
// SELECT * FROM (SELECT user_id FROM premium_users) AS premium WHERE premium.user_id > 1000
```

## ClickHouse Specific

### ARRAY JOIN

```typescript
const query = sql()
  .select('event_id', 'tag')
  .from('events')
  .arrayJoin('tags')
  .build()
// SELECT event_id, tag FROM events ARRAY JOIN tags
```

### SETTINGS Clause

```typescript
const query = sql()
  .select('*')
  .from('large_table')
  .settings({
    max_execution_time: 60,
    max_memory_usage: 10000000000
  })
  .build()
// SELECT * FROM large_table SETTINGS max_execution_time = 60, max_memory_usage = 10000000000
```

### FORMAT Clause

```typescript
const query = sql()
  .select('id', 'name')
  .from('users')
  .format('JSONEachRow')
  .build()
// SELECT id, name FROM users FORMAT JSONEachRow
```

### Combined ClickHouse Features

```typescript
const query = sql()
  .select('user_id', 'tag', 'COUNT(*)')
  .from('events')
  .arrayJoin('tags')
  .where('timestamp', '>', '2024-01-01')
  .groupBy('user_id', 'tag')
  .orderBy('COUNT(*)', 'DESC')
  .limit(100)
  .settings({ max_execution_time: 30 })
  .format('JSONEachRow')
  .build()
```

## Using Helpers

### Column Helpers

```typescript
import { sql, col } from '@/lib/sql-builder'

const query = sql()
  .select(
    'query_id',
    col('memory_usage').readable().toSql(),
    col('query_duration_ms').pctOfMax().toSql()
  )
  .from('system.query_log')
  .orderBy('query_duration_ms', 'DESC')
  .build()
// SELECT query_id, formatReadableSize(memory_usage) AS readable_memory_usage, round(100 * query_duration_ms / max(query_duration_ms) OVER (), 2) AS pct_query_duration_ms FROM system.query_log ORDER BY query_duration_ms DESC
```

### Function Helpers

```typescript
import { sql, fn } from '@/lib/sql-builder'

const query = sql()
  .selectRaw(`${fn.count()} as total`)
  .selectRaw(`${fn.sum('bytes')} as total_bytes`)
  .selectRaw(`${fn.avg('duration')} as avg_duration`)
  .from('query_log')
  .build()
// SELECT count() as total, sum(bytes) as total_bytes, avg(duration) as avg_duration FROM query_log
```

### Raw SQL

```typescript
import { sql, raw } from '@/lib/sql-builder'

const query = sql()
  .select('user_id')
  .select(raw('CASE WHEN age > 18 THEN "adult" ELSE "minor" END').as('age_group').toSql())
  .from('users')
  .build()
// SELECT user_id, (CASE WHEN age > 18 THEN "adult" ELSE "minor" END) AS age_group FROM users
```

## Ordering and Pagination

### ORDER BY

```typescript
const query = sql()
  .select('*')
  .from('users')
  .orderBy('created_at', 'DESC')
  .orderBy('name', 'ASC')
  .build()
// SELECT * FROM users ORDER BY created_at DESC, name ASC
```

### ORDER BY with NULLS

```typescript
const query = sql()
  .select('*')
  .from('users')
  .orderBy('last_login', 'DESC', 'LAST')
  .build()
// SELECT * FROM users ORDER BY last_login DESC NULLS LAST
```

### LIMIT and OFFSET

```typescript
const query = sql()
  .select('*')
  .from('users')
  .orderBy('id')
  .limit(10)
  .offset(20)
  .build()
// SELECT * FROM users ORDER BY id ASC LIMIT 10 OFFSET 20
```

## Pretty Formatting

```typescript
const query = sql()
  .select('id', 'name', 'email')
  .from('users')
  .where('status', '=', 'active')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .buildPretty()

/*
SELECT id, name, email
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10
*/
```

## Immutability

The builder is immutable - each method returns a new instance:

```typescript
const base = sql().select('id').from('users')

const activeUsers = base.where('status', '=', 'active')
const deletedUsers = base.where('status', '=', 'deleted')

console.log(activeUsers.build())
// SELECT id FROM users WHERE status = 'active'

console.log(deletedUsers.build())
// SELECT id FROM users WHERE status = 'deleted'
```

## Version Extension Pattern

The builder supports version inheritance for ClickHouse version-aware queries:

### Basic Extension

```typescript
import { sql } from '@/lib/sql-builder'

// Base query for ClickHouse 23.8
const v23 = sql()
  .select('query', 'user', 'memory_usage', 'elapsed')
  .from('system.processes')
  .where('is_cancelled', '=', 0)
  .orderBy('elapsed', 'DESC')

// Extend for ClickHouse 24.1 (adds peak_threads_usage column)
const v24 = v23
  .extend()
  .addColumn('peak_threads_usage')

console.log(v23.build())
// SELECT query, user, memory_usage, elapsed FROM system.processes WHERE is_cancelled = 0 ORDER BY elapsed DESC

console.log(v24.build())
// SELECT query, user, memory_usage, elapsed, peak_threads_usage FROM system.processes WHERE is_cancelled = 0 ORDER BY elapsed DESC
```

### Chained Extensions

Extensions can be chained indefinitely:

```typescript
// v23.8: Base query
const v23 = sql()
  .select('query', 'user', 'memory_usage')
  .from('system.processes')
  .where('is_cancelled', '=', 0)

// v24.1: Add peak_threads_usage
const v24 = v23
  .extend()
  .addColumn('peak_threads_usage')

// v24.3: Add query_cache_usage
const v24_3 = v24
  .extend()
  .addColumn('query_cache_usage')

// v25.1: Change ordering to memory_usage
const v25 = v24_3
  .extend()
  .removeOrderBy('elapsed')
  .addOrderBy('memory_usage', 'DESC')

// All build correctly
console.log(v23.build())    // 3 columns, ORDER BY elapsed
console.log(v24.build())    // 4 columns
console.log(v24_3.build())  // 5 columns
console.log(v25.build())    // 5 columns, ORDER BY memory_usage
```

### Extension Methods

```typescript
// Column modifications
.addColumn('new_column')
.removeColumn('old_column')
.replaceColumn('old', 'new AS alias')

// WHERE modifications
.addWhere('status', '=', 'active')
.removeWhere('status', '=', 'inactive')

// ORDER BY modifications
.addOrderBy('created_at', 'DESC')
.changeOrderBy('elapsed', 'ASC')
.removeOrderBy('old_order')

// JOIN modifications
.addJoin('other_table', 'o', 'o.id = t.id')
.addLeftJoin('optional_table', 'opt', { using: ['id'] })
.removeJoin('old_alias')
```

### Real-World Usage with QueryConfig

```typescript
import type { QueryConfig } from '@/types/query-config'

// Base query for oldest supported version
const v23 = sql()
  .select('query', 'user', fn.readableSize('memory_usage'))
  .from('system.processes')
  .where('is_cancelled', '=', 0)
  .orderBy('elapsed', 'DESC')

// Extend for v24.1+
const v24 = v23
  .extend()
  .addColumn('peak_threads_usage')
  .addColumn(fn.pctOfMax('peak_threads_usage'))

// Use in QueryConfig with VersionedSql format
export const config: QueryConfig = {
  name: 'running-queries',
  sql: [
    { since: '23.8', sql: v23.build() },
    { since: '24.1', sql: v24.build() },
  ],
  columns: ['query', 'user', 'readable_memory_usage', 'peak_threads_usage', 'pct_peak_threads_usage'],
}
```

## Error Handling

```typescript
import { sql, SqlBuilderError } from '@/lib/sql-builder'

try {
  // Missing FROM clause
  const query = sql().select('id').build()
} catch (err) {
  if (err instanceof SqlBuilderError) {
    console.error('Invalid query:', err.message)
    console.error('Context:', err.context)
  }
}

try {
  // HAVING without GROUP BY
  const query = sql()
    .select('COUNT(*)')
    .from('users')
    .having('COUNT(*)', '>', 5)
    .build()
} catch (err) {
  if (err instanceof SqlBuilderError) {
    console.error('Invalid query:', err.message)
  }
}
```
