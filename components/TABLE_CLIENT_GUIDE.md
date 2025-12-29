# TableClient Component Guide

## Overview

`TableClient` is a client-side wrapper component that handles data fetching for data tables using SWR (stale-while-revalidate) caching. It manages loading states, error handling, and empty states automatically, providing a consistent user experience across all table views.

## Features

- **SWR-powered data fetching** with automatic caching and revalidation
- **Loading state** with skeleton loader
- **Error handling** with detailed error messages and retry capability
- **Empty state** handling for queries with no results
- **Automatic refresh** every 30 seconds (configurable)
- **Search params support** for filtering, sorting, and pagination
- **Metadata display** showing row count and query duration
- **TypeScript support** with full type safety

## Usage

### Basic Example

```tsx
// app/[host]/my-table/page.tsx
import { TableClient } from '@/components/table-client'
import { myTableConfig } from './config'

export default function MyTablePage() {
  return (
    <TableClient
      title="My Table"
      queryConfig={myTableConfig}
    />
  )
}
```

### With Description

```tsx
<TableClient
  title="Query Logs"
  description="All queries executed on the cluster in the last 24 hours"
  queryConfig={queryLogsConfig}
/>
```

### With Search Parameters

```tsx
export default function FilteredTablePage() {
  const searchParams = useSearchParams()

  return (
    <TableClient
      title="Filtered Data"
      queryConfig={dataConfig}
      searchParams={{
        database: searchParams.get('database') || '',
        table: searchParams.get('table') || '',
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '100'),
      }}
    />
  )
}
```

### With Custom Page Size

```tsx
<TableClient
  title="Large Dataset"
  queryConfig={largeDataConfig}
  defaultPageSize={500}
/>
```

### Complete Example

```tsx
// app/[host]/system-tables/page.tsx
'use client'

import { TableClient } from '@/components/table-client'
import type { QueryConfig } from '@/types/query-config'

const systemTablesConfig: QueryConfig = {
  name: 'system_tables',
  sql: `
    SELECT
      name,
      database,
      engine,
      formatReadableQuantity(total_rows) as total_rows,
      formatReadableSize(total_bytes) as total_bytes
    FROM system.tables
    WHERE database NOT IN ('system', 'information_schema')
    ORDER BY total_bytes DESC
  `,
  columns: ['name', 'database', 'engine', 'total_rows', 'total_bytes'],
}

export default function SystemTablesPage() {
  return (
    <TableClient
      title="System Tables"
      description="Overview of all tables in the cluster excluding system tables"
      queryConfig={systemTablesConfig}
      defaultPageSize={100}
    />
  )
}
```

## Props

### Interface

```typescript
interface TableClientProps {
  /** Main heading for the table */
  title: string

  /** Optional subtitle or description */
  description?: string | React.ReactNode

  /** Query configuration with SQL and column definitions */
  queryConfig: QueryConfig

  /** Search/filter parameters to pass to the API */
  searchParams?: Record<string, string | number | boolean>

  /** Optional CSS class names for styling */
  className?: string

  /** Number of rows per page (default: 100) */
  defaultPageSize?: number
}
```

### Props Details

#### `title` (required)
The main heading displayed above the table.

#### `description` (optional)
Additional context about the table. Can be a string or React component for rich content.

#### `queryConfig` (required)
The `QueryConfig` object that defines the SQL query and column formatting. See [Query Configuration](./QUERY_CONFIG_GUIDE.md) for details.

#### `searchParams` (optional)
Parameters to pass to the API for filtering, sorting, and pagination. All keys from search params are forwarded to the DataTable context.

#### `className` (optional)
CSS classes to apply to the root container.

#### `defaultPageSize` (optional)
Number of rows to display per page. Defaults to 100.

## States

### Loading State
While data is being fetched, a skeleton loader is displayed:
```tsx
<TableSkeleton />
```

### Error State
If the API request fails, an error alert is shown with the error message and an option to retry:
```tsx
<ErrorAlert
  title="Error loading data"
  message={error.message}
  errorType="query_error"
  reset={refresh}
  query={queryConfig.sql}
/>
```

### Empty State
When the query returns no results:
```tsx
<ErrorAlert
  title="No Data"
  message="No data available for this query"
  variant="info"
  query={queryConfig.sql}
/>
```

### Success State
Successfully loaded data is displayed in a DataTable with:
- All configured columns
- Sorting and filtering capabilities
- Pagination controls
- Metadata footer showing row count and query duration

## API Integration

TableClient makes requests to `/api/v1/tables/[name]` with the following parameters:

```
GET /api/v1/tables/system_tables?hostId=0&database=default&limit=100
```

The API returns:

```json
{
  "success": true,
  "data": [
    { "name": "users", "database": "default", "engine": "MergeTree" },
    ...
  ],
  "metadata": {
    "queryId": "abc123",
    "duration": 150,
    "rows": 100,
    "host": "localhost"
  }
}
```

## Data Fetching Behavior

### Caching Strategy
- **Deduplication interval**: 3 seconds (multiple requests in quick succession return cached data)
- **Focus throttle**: 5 seconds (data not revalidated when window gains focus within this period)
- **Auto-refresh**: 30 seconds (data automatically refetched every 30 seconds)
- **Stale-while-revalidate**: Stale data served immediately while fresh data is fetched in background

### Network Recovery
SWR automatically revalidates data when:
- Network connection is restored
- Component is remounted
- Window regains focus (after throttle period)

## Error Handling

The component handles various error scenarios:

1. **Network Errors**: Connection failures, timeouts
2. **Query Errors**: SQL syntax errors, missing tables
3. **Validation Errors**: Missing required parameters
4. **Permission Errors**: Access denied to tables
5. **Table Not Found**: Specified table doesn't exist

Each error type includes:
- Clear user-friendly message
- Query details for debugging (expandable accordion)
- Retry button with countdown timer
- Error ID for support

## Performance Considerations

1. **Component Memoization**: The component is optimized to prevent unnecessary re-renders
2. **Metadata Caching**: Table metadata is cached for 5 minutes to avoid repeated validation
3. **Query Optimization**: All queries include `QUERY_COMMENT` for ClickHouse logging
4. **Response Caching**: API responses are cached with:
   - S-maxage: 30 seconds
   - Stale-while-revalidate: 60 seconds

## Accessibility

The component includes:
- Semantic HTML structure
- Proper ARIA labels (from underlying DataTable)
- Keyboard navigation support
- Focus management for interactive elements
- Error messages accessible to screen readers

## Testing

The component includes comprehensive Cypress tests covering:
- Loading state
- Data rendering
- Error handling
- Empty state
- Metadata display
- Custom props

Run tests with:
```bash
pnpm component:headless
```

## Common Issues

### Issue: Component throws "useHostId: host parameter is missing"
**Solution**: Ensure the component is used within a route that has the `[host]` dynamic segment.

### Issue: Data not updating
**Solution**: Check that `hostId` is correctly extracted from the URL. The component automatically refreshes every 30 seconds.

### Issue: API 404 error
**Solution**: Verify that the query config name exists in the table registry. Check `/lib/api/table-registry.ts` for available configurations.

### Issue: Empty state shown for valid data
**Solution**: Ensure the query config columns match the actual data columns returned by ClickHouse.

## Migration Guide

If migrating from server-side data fetching:

### Before (Server Component)
```tsx
export default async function MyTablePage() {
  const data = await fetchData(myQuery)
  return <DataTable data={data} queryConfig={config} />
}
```

### After (Client Component with TableClient)
```tsx
'use client'

export default function MyTablePage() {
  return <TableClient queryConfig={config} title="My Table" />
}
```

Benefits:
- Automatic caching and revalidation
- Better error handling and user feedback
- Responsive UI with skeleton loaders
- Automatic refresh capability
- Reduced server load

## Advanced Usage

### Custom Search Params from URL

```tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { TableClient } from '@/components/table-client'

export default function SearchableTable() {
  const searchParams = useSearchParams()

  return (
    <TableClient
      title="Searchable Data"
      queryConfig={searchConfig}
      searchParams={{
        search: searchParams.get('q') || '',
        sortBy: searchParams.get('sort') || 'name',
        sortOrder: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
        page: parseInt(searchParams.get('page') || '1'),
      }}
    />
  )
}
```

### Combining with URL Navigation

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function AdvancedTable() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('q', query)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <TableClient
      title="Advanced Search"
      queryConfig={config}
      searchParams={Object.fromEntries(searchParams)}
    />
  )
}
```

## See Also

- [QueryConfig Documentation](./QUERY_CONFIG_GUIDE.md)
- [DataTable Component](./data-table/DATA_TABLE_GUIDE.md)
- [SWR Hook Documentation](../lib/swr/USE_TABLE_DATA.md)
