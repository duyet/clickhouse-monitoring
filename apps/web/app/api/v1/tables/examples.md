# Tables API Examples

## Table of Contents
- [Basic Queries](#basic-queries)
- [Parameterized Queries](#parameterized-queries)
- [Error Handling](#error-handling)
- [TypeScript Integration](#typescript-integration)

## Basic Queries

### Fetch Cluster Information

```bash
curl -s "http://localhost:3000/api/v1/tables/clusters?hostId=0" | jq
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "cluster": "default",
      "shard_count": 1,
      "replica_count": 1,
      "replica_status": "Replicas Status"
    }
  ],
  "metadata": {
    "queryId": "abc123",
    "duration": 45,
    "rows": 1,
    "host": "localhost:8123"
  }
}
```

### Fetch Disk Information

```bash
curl -s "http://localhost:3000/api/v1/tables/disks?hostId=0" | jq
```

### Fetch Running Queries

```bash
curl -s "http://localhost:3000/api/v1/tables/running-queries?hostId=0" | jq '.data | length'
```

### Fetch Tables Overview

```bash
curl -s "http://localhost:3000/api/v1/tables/tables-overview?hostId=0" | jq '.data[0]'
```

## Parameterized Queries

### Fetch Columns for a Specific Table

The `columns` query requires `database` and `table` parameters:

```bash
curl -s "http://localhost:3000/api/v1/tables/columns?hostId=0&database=default&table=users" | jq
```

Response includes column details:
```json
{
  "success": true,
  "data": [
    {
      "column": "id",
      "type": "UInt64",
      "readable_compressed": "1.2 MiB",
      "readable_uncompressed": "4.5 MiB",
      "compr_ratio": 3.75,
      "readable_rows_cnt": "100000",
      "avg_row_size": 45,
      "codec": "ZSTD(1)",
      "comment": "User ID"
    }
  ],
  "metadata": { ... }
}
```

### Override Default Parameters

The `database-disk-usage-by-database` query has a default `database='default'`:

```bash
# Use default database
curl -s "http://localhost:3000/api/v1/tables/database-disk-usage-by-database?hostId=0" | jq

# Override with custom database
curl -s "http://localhost:3000/api/v1/tables/database-disk-usage-by-database?hostId=0&database=system" | jq
```

### Fetch Replica Status for a Cluster

The `count-across-replicas` query requires a `cluster` parameter:

```bash
curl -s "http://localhost:3000/api/v1/tables/count-across-replicas?hostId=0&cluster=default" | jq
```

## Error Handling

### Missing Required Parameter

```bash
curl -s "http://localhost:3000/api/v1/tables/clusters" | jq
```

Response:
```json
{
  "success": false,
  "error": {
    "type": "validation_error",
    "message": "Missing required query parameter: hostId"
  },
  "metadata": {
    "queryId": "",
    "duration": 0,
    "rows": 0,
    "host": "unknown"
  }
}
```

### Non-existent Table

```bash
curl -s "http://localhost:3000/api/v1/tables/invalid-table?hostId=0" | jq
```

Response:
```json
{
  "success": false,
  "error": {
    "type": "table_not_found",
    "message": "Table query configuration not found: invalid-table",
    "details": {
      "availableTables": "backups, clusters, columns, ..."
    }
  },
  "metadata": { ... }
}
```

### Optional Table Not Available

```bash
curl -s "http://localhost:3000/api/v1/tables/backups?hostId=0" | jq
```

If the `system.backup_log` table doesn't exist:
```json
{
  "success": false,
  "error": {
    "type": "table_not_found",
    "message": "Table system.backup_log does not exist. This table requires backup configuration to be enabled.",
    "details": {
      "table": "system.backup_log"
    }
  },
  "metadata": { ... }
}
```

## TypeScript Integration

### Type-Safe API Client

```typescript
import type { ApiResponse } from '@/lib/api/types'

interface TableData {
  cluster: string
  shard_count: number
  replica_count: number
}

async function fetchClusters(hostId: number): Promise<TableData[]> {
  const response = await fetch(
    `/api/v1/tables/clusters?hostId=${hostId}`
  )

  const data: ApiResponse<TableData[]> = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Unknown error')
  }

  return data.data || []
}

// Usage
try {
  const clusters = await fetchClusters(0)
  console.log(`Found ${clusters.length} clusters`)
} catch (error) {
  console.error('Failed to fetch clusters:', error)
}
```

### Generic Table Fetcher

```typescript
import type { ApiResponse } from '@/lib/api/types'

async function fetchTableData<T>(
  tableName: string,
  hostId: number,
  params?: Record<string, string>
): Promise<T[]> {
  const searchParams = new URLSearchParams({
    hostId: String(hostId),
    ...params,
  })

  const response = await fetch(
    `/api/v1/tables/${tableName}?${searchParams.toString()}`
  )

  const data: ApiResponse<T[]> = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Unknown error')
  }

  return data.data || []
}

// Usage
const columns = await fetchTableData('columns', 0, {
  database: 'default',
  table: 'users',
})

const disks = await fetchTableData('disks', 0)
```

### React Hook

```typescript
import { useState, useEffect } from 'react'
import type { ApiResponse } from '@/lib/api/types'

function useTableData<T>(
  tableName: string,
  hostId: number,
  params?: Record<string, string>
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const searchParams = new URLSearchParams({
          hostId: String(hostId),
          ...params,
        })

        const response = await fetch(
          `/api/v1/tables/${tableName}?${searchParams.toString()}`
        )

        const result: ApiResponse<T[]> = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Unknown error')
        }

        setData(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tableName, hostId, JSON.stringify(params)])

  return { data, loading, error }
}

// Usage in a component
function ClusterList({ hostId }: { hostId: number }) {
  const { data, loading, error } = useTableData('clusters', hostId)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <ul>
      {data.map((cluster: any) => (
        <li key={cluster.cluster}>{cluster.cluster}</li>
      ))}
    </ul>
  )
}
```

### Server Component Usage

```typescript
import type { ApiResponse } from '@/lib/api/types'

async function ClustersPage({ params }: { params: { hostId: string } }) {
  const response = await fetch(
    `http://localhost:3000/api/v1/tables/clusters?hostId=${params.hostId}`,
    {
      // Enable Next.js revalidation
      next: { revalidate: 30 },
    }
  )

  const data: ApiResponse<Cluster[]> = await response.json()

  if (!data.success) {
    return <div>Error: {data.error?.message}</div>
  }

  return (
    <div>
      <h1>Clusters</h1>
      <ul>
        {data.data?.map((cluster) => (
          <li key={cluster.cluster}>{cluster.cluster}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Advanced Usage

### Pagination

```typescript
interface PaginationParams {
  offset?: number
  limit?: number
}

async function fetchPaginatedData<T>(
  tableName: string,
  hostId: number,
  pagination: PaginationParams = {}
): Promise<ApiResponse<T[]>> {
  const { offset = 0, limit = 100 } = pagination

  const searchParams = new URLSearchParams({
    hostId: String(hostId),
    offset: String(offset),
    limit: String(limit),
  })

  const response = await fetch(
    `/api/v1/tables/${tableName}?${searchParams.toString()}`
  )

  return response.json()
}

// Fetch first page
const page1 = await fetchPaginatedData('running-queries', 0, {
  offset: 0,
  limit: 50,
})

// Fetch second page
const page2 = await fetchPaginatedData('running-queries', 0, {
  offset: 50,
  limit: 50,
})
```

### Combining Multiple Queries

```typescript
async function fetchDashboardData(hostId: number) {
  const [clusters, disks, runningQueries] = await Promise.all([
    fetchTableData('clusters', hostId),
    fetchTableData('disks', hostId),
    fetchTableData('running-queries', hostId),
  ])

  return {
    clusters,
    disks,
    runningQueries,
  }
}
```
