# API Types Module

Provides TypeScript type definitions for the ClickHouse monitoring API layer, ensuring type safety across request handling, response formatting, and error management.

## Interfaces

### ApiRequest

Main interface for query execution requests.

```typescript
interface ApiRequest {
  readonly query: string // SQL query to execute
  readonly queryParams?: Record<string, string | number | boolean> // Query parameters
  readonly hostId: string // Target host identifier
  readonly format?: 'JSONEachRow' | 'JSON' | 'CSV' | 'TSV' // Response format
  readonly queryConfig?: QueryConfig // Optional query metadata
}
```

### ApiResponse<T>

Generic wrapper for API responses with metadata and error handling.

```typescript
interface ApiResponse<T = unknown> {
  readonly success: boolean // Request success status
  readonly data?: T // Response data (when success is true)
  readonly metadata: ApiResponseMetadata // Execution metadata
  readonly error?: ApiError // Error details (when success is false)
}
```

### ApiResponseMetadata

Contains query execution information.

```typescript
interface ApiResponseMetadata {
  readonly queryId: string // Unique query execution identifier
  readonly duration: number // Execution duration in milliseconds
  readonly rows: number // Number of rows returned
  readonly host: string // Host that executed the query
  readonly cachedAt?: number // Cache timestamp if applicable
}
```

### ApiError

Detailed error information with context.

```typescript
interface ApiError {
  readonly type: ApiErrorType // Error classification
  readonly message: string // Human-readable message
  readonly details?: Record<string, string | number | boolean | undefined> // Additional context
}
```

### ChartDataRequest

Request structure for fetching chart data.

```typescript
interface ChartDataRequest {
  readonly chartName: string // Chart identifier
  readonly hostId: string // Target host
  readonly interval?: string // Aggregation interval (e.g., '1m', '1h', '1d')
  readonly lastHours?: number // Historical data range
  readonly params?: Record<string, string | number | boolean> // Chart-specific parameters
}
```

### TableDataRequest

Request structure for fetching table data with filtering.

```typescript
interface TableDataRequest {
  readonly queryConfigName: string // Query configuration name
  readonly hostId: string // Target host
  readonly searchParams?: Record<string, string | string[]> // Filter parameters
}
```

## Enums

### ApiErrorType

Error classification enumeration:

- `TableNotFound` - Table does not exist in ClickHouse
- `ValidationError` - Request validation failed
- `QueryError` - Query execution error
- `NetworkError` - Network or connection error
- `PermissionError` - Permission or authentication error

## Usage Examples

### Type-safe API call

```typescript
import type { ApiRequest, ApiResponse } from '@/lib/api'

const request: ApiRequest = {
  query: 'SELECT * FROM system.tables WHERE database = {db: String}',
  queryParams: { db: 'default' },
  hostId: 'primary',
  format: 'JSONEachRow',
}

const response: ApiResponse<TableData[]> = await fetchData(request)
if (response.success && response.data) {
  // Type-safe data access
  response.data.forEach((row) => {
    console.log(row.name, response.metadata.queryId)
  })
}
```

### Error handling

```typescript
import type { ApiResponse } from '@/lib/api'
import { ApiErrorType } from '@/lib/api'

const response: ApiResponse<unknown> = await fetchData(request)
if (!response.success) {
  switch (response.error?.type) {
    case ApiErrorType.TableNotFound:
      console.error('Table not available:', response.error.details?.table)
      break
    case ApiErrorType.PermissionError:
      console.error('Permission denied:', response.error.message)
      break
    default:
      console.error('Error:', response.error?.message)
  }
}
```

### Chart data request

```typescript
import type { ChartDataRequest, ApiResponse } from '@/lib/api'

const chartRequest: ChartDataRequest = {
  chartName: 'query-performance',
  hostId: 'primary',
  interval: '1m',
  lastHours: 24,
  params: {
    minDuration: 1000,
  },
}

const response: ApiResponse<ChartData> = await fetchChartData(chartRequest)
```

## Design Principles

- **Immutability**: All properties use `readonly` modifier for type safety
- **Composability**: Generic `ApiResponse<T>` allows type-safe data handling
- **Error Context**: Comprehensive error information for debugging
- **Metadata**: Execution details included with every response
- **Flexibility**: Optional fields for extensible configurations

## Related Types

- See `types/query-config.ts` for QueryConfig interface
- See `types/column-format.ts` for column formatting types
