# TableClient Usage Examples

Quick reference guide with practical examples for using `TableClient` in different scenarios.

## Example 1: Simple Read-Only Table

```tsx
// app/[host]/system-tables/page.tsx
'use client'

import { TableClient } from '@/components/table-client'
import { systemTablesConfig } from './config'

export default function SystemTablesPage() {
  return (
    <TableClient
      title="System Tables"
      description="All tables in the ClickHouse cluster"
      queryConfig={systemTablesConfig}
    />
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const systemTablesConfig: QueryConfig = {
  name: 'system_tables',
  sql: `
    SELECT
      name,
      database,
      engine,
      total_rows,
      total_bytes
    FROM system.tables
    ORDER BY total_bytes DESC
  `,
  columns: ['name', 'database', 'engine', 'total_rows', 'total_bytes'],
}
```

## Example 2: Table with Search/Filter

```tsx
// app/[host]/database/[database]/search/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { TableClient } from '@/components/table-client'
import { databaseSearchConfig } from './config'

export default function SearchPage({
  params,
}: {
  params: { database: string }
}) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  return (
    <TableClient
      title={`Search Results in ${params.database}`}
      description={query ? `Results for "${query}"` : 'Enter a search term'}
      queryConfig={databaseSearchConfig}
      searchParams={{
        database: params.database,
        search: query,
      }}
    />
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const databaseSearchConfig: QueryConfig = {
  name: 'database_search',
  sql: `
    SELECT * FROM system.tables
    WHERE database = {database: String}
    AND (name LIKE {search: String} OR comment LIKE {search: String})
    LIMIT 1000
  `,
  columns: ['name', 'database', 'engine', 'comment'],
}
```

## Example 3: Paginated Results

```tsx
// app/[host]/logs/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TableClient } from '@/components/table-client'
import { queryLogsConfig } from './config'

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogsContent />
    </Suspense>
  )
}

function LogsContent() {
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  return (
    <TableClient
      title="Query Logs"
      description="Recent queries executed on the cluster"
      queryConfig={queryLogsConfig}
      searchParams={{
        limit,
        offset,
      }}
      defaultPageSize={limit}
    />
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const queryLogsConfig: QueryConfig = {
  name: 'query_logs',
  sql: `
    SELECT
      query_id,
      user,
      client_hostname,
      query_start_time,
      query_duration_ms,
      read_rows,
      result_rows
    FROM system.query_log
    WHERE event_date >= today() - 1
    ORDER BY query_start_time DESC
    LIMIT {limit: UInt32}
    OFFSET {offset: UInt32}
  `,
  columns: [
    'query_id',
    'user',
    'client_hostname',
    'query_start_time',
    'query_duration_ms',
    'read_rows',
    'result_rows',
  ],
}
```

## Example 4: Filtered Table with Multiple Search Criteria

```tsx
// app/[host]/metrics/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { TableClient } from '@/components/table-client'
import { metricsConfig } from './config'

export default function MetricsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilter = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search metric..."
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) =>
            handleFilter({ search: e.target.value })
          }
        />
        <select
          defaultValue={searchParams.get('type') || ''}
          onChange={(e) =>
            handleFilter({ type: e.target.value })
          }
        >
          <option value="">All Types</option>
          <option value="counter">Counter</option>
          <option value="gauge">Gauge</option>
          <option value="histogram">Histogram</option>
        </select>
      </div>

      <TableClient
        title="Metrics"
        queryConfig={metricsConfig}
        searchParams={Object.fromEntries(searchParams)}
      />
    </div>
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const metricsConfig: QueryConfig = {
  name: 'metrics',
  sql: `
    SELECT
      metric_name,
      metric_type,
      description,
      current_value,
      last_updated
    FROM system.metrics
    WHERE metric_name LIKE {search: String}
    AND ({type: String} = '' OR metric_type = {type: String})
    ORDER BY metric_name
  `,
  columns: [
    'metric_name',
    'metric_type',
    'description',
    'current_value',
    'last_updated',
  ],
}
```

## Example 5: Table with Actions

```tsx
// app/[host]/users/page.tsx
'use client'

import { TableClient } from '@/components/table-client'
import { usersConfig } from './config'

export default function UsersPage() {
  return (
    <TableClient
      title="Users"
      description="Database users and their permissions"
      queryConfig={usersConfig}
    />
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const usersConfig: QueryConfig = {
  name: 'users',
  sql: `
    SELECT
      name,
      default_database,
      interface,
      profile_name
    FROM system.users
    ORDER BY name
  `,
  columns: [
    'name',
    'default_database',
    'interface',
    'profile_name',
  ],
  actions: [
    {
      label: 'View Details',
      href: '/[host]/users/[name]',
      params: { name: 'name' },
    },
    {
      label: 'Edit Permissions',
      href: '/[host]/users/[name]/permissions',
      params: { name: 'name' },
    },
  ],
}
```

## Example 6: Responsive Layout with Sidebar

```tsx
// app/[host]/data-explorer/page.tsx
'use client'

import { useState } from 'react'
import { TableClient } from '@/components/table-client'
import { explorerConfig } from './config'

export default function DataExplorerPage() {
  const [database, setDatabase] = useState('default')

  return (
    <div className="flex gap-4">
      <aside className="w-48">
        <h3 className="mb-2 font-bold">Databases</h3>
        <select
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          className="w-full"
        >
          <option value="default">default</option>
          <option value="system">system</option>
          <option value="information_schema">information_schema</option>
        </select>
      </aside>

      <main className="flex-1">
        <TableClient
          title={`Tables in ${database}`}
          queryConfig={explorerConfig}
          searchParams={{ database }}
        />
      </main>
    </div>
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const explorerConfig: QueryConfig = {
  name: 'explorer_tables',
  sql: `
    SELECT
      name,
      engine,
      total_rows,
      formatReadableSize(total_bytes) as total_size
    FROM system.tables
    WHERE database = {database: String}
    ORDER BY total_bytes DESC
  `,
  columns: ['name', 'engine', 'total_rows', 'total_size'],
}
```

## Example 7: Real-time Monitoring Dashboard

```tsx
// app/[host]/monitor/page.tsx
'use client'

import { TableClient } from '@/components/table-client'
import { runningQueriesConfig } from './config'

export default function MonitorPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <TableClient
        title="Running Queries"
        description="Queries currently executing on the cluster"
        queryConfig={runningQueriesConfig}
      />

      <TableClient
        title="Merges"
        description="MergeTree merge operations in progress"
        queryConfig={mergesConfig}
      />
    </div>
  )
}
```

**config.ts:**
```typescript
import type { QueryConfig } from '@/types/query-config'

export const runningQueriesConfig: QueryConfig = {
  name: 'running_queries',
  sql: `
    SELECT
      query_id,
      user,
      query,
      elapsed,
      read_rows,
      written_rows
    FROM system.processes
    ORDER BY elapsed DESC
  `,
  columns: [
    'query_id',
    'user',
    'query',
    'elapsed',
    'read_rows',
    'written_rows',
  ],
}

export const mergesConfig: QueryConfig = {
  name: 'merges',
  sql: `
    SELECT
      database,
      table,
      partition,
      elapsed,
      progress
    FROM system.merges
    ORDER BY elapsed DESC
  `,
  columns: ['database', 'table', 'partition', 'elapsed', 'progress'],
}
```

## Tips & Tricks

### Tip 1: Dynamic Query Config
```tsx
// Use function to generate config based on props
function getConfig(database: string) {
  return {
    name: `tables_${database}`,
    sql: `SELECT * FROM system.tables WHERE database = '${database}'`,
    columns: ['name', 'engine', 'total_rows'],
  }
}
```

### Tip 2: Custom Error Handling
```tsx
// Wrap in error boundary for advanced error handling
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <TableClient queryConfig={config} title="My Table" />
</ErrorBoundary>
```

### Tip 3: Conditional Rendering
```tsx
// Show different configs based on user permissions
{isAdmin ? (
  <TableClient queryConfig={adminConfig} title="Admin View" />
) : (
  <TableClient queryConfig={userConfig} title="User View" />
)}
```

### Tip 4: Nested Tables
```tsx
// Master-detail pattern
export default function MasterDetail() {
  const [selectedRow, setSelectedRow] = useState(null)

  return (
    <div className="grid grid-cols-2 gap-4">
      <TableClient
        title="Master"
        queryConfig={masterConfig}
      />
      {selectedRow && (
        <TableClient
          title={`Details for ${selectedRow.name}`}
          queryConfig={detailConfig}
          searchParams={{ id: selectedRow.id }}
        />
      )}
    </div>
  )
}
```

## See Also

- [TableClient Component Documentation](./TABLE_CLIENT_GUIDE.md)
- [QueryConfig Type Definition](../types/query-config.ts)
- [useTableData Hook](../lib/swr/use-table-data.ts)
