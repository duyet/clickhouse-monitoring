# Chart Loading State Components

This document describes the ChartSkeleton and ChartError components created for handling SWR-based chart loading states.

## Components

### ChartSkeleton

A skeleton loading component that matches the size and layout of actual chart cards.

**Location**: `components/charts/chart-skeleton.tsx`

**Props**:
- `className?: string` - CSS classes to apply to the Card wrapper
- `chartClassName?: string` - CSS classes to apply to the Skeleton (chart area)
- `title?: string` - Optional title to display. If not provided, a skeleton loader will appear in its place

**Usage**:
```tsx
import { ChartSkeleton } from '@/components/charts'

export function MyChartContainer() {
  return <ChartSkeleton title="Query Duration" chartClassName="h-64" />
}
```

### ChartError

An error state component that displays API errors with context-aware messaging.

**Location**: `components/charts/chart-error.tsx`

**Props**:
- `error: ApiError` - The error object from the API (from `@/lib/api/types`)
- `title?: string` - Optional title for the error card (default: "Chart Error")
- `className?: string` - CSS classes to apply to the Card wrapper
- `onRetry?: () => void` - Optional callback to retry fetching

**Features**:
- Displays the error message prominently
- Special messaging for table_not_found errors (suggests configuration)
- Optional retry button for interactive recovery
- Color-coded styling (red/destructive theme)

**Usage**:
```tsx
import { ChartError } from '@/components/charts'
import type { ApiError } from '@/lib/api/types'

export function MyChartContainer({ error, onRetry }: { error?: ApiError; onRetry?: () => void }) {
  if (error) {
    return <ChartError error={error} title="Query Duration" onRetry={onRetry} />
  }

  return <div>{/* Chart content */}</div>
}
```

## Integration with SWR

These components are designed to work seamlessly with SWR for loading state management:

```tsx
'use client'

import useSWR from 'swr'
import { ChartError, ChartSkeleton } from '@/components/charts'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'

export function MyChart({ hostId }: { hostId: string }) {
  const { data, error, mutate, isLoading } = useSWR(
    [`/api/v1/charts/query-duration`, hostId],
    ([url, host]) => fetch(`${url}?hostId=${host}`).then(r => r.json())
  )

  if (isLoading) {
    return <ChartSkeleton title="Query Duration" />
  }

  if (error?.error) {
    return (
      <ChartError
        error={error.error}
        title="Query Duration"
        onRetry={mutate}
      />
    )
  }

  return (
    <ChartCard title="Query Duration" data={data?.data}>
      <BarChart
        data={data?.data || []}
        index="event_time"
        categories={['duration']}
      />
    </ChartCard>
  )
}
```

## Design System Integration

Both components:
- Use the existing `Card`, `CardHeader`, `CardContent` components for consistency
- Use the `Skeleton` component with pulse animation
- Apply proper padding (`p-2`) consistent with `ChartCard`
- Use semantic color tokens (destructive, muted-foreground)
- Match the rounded-md corner styling of existing charts
- Support custom className props for flexibility

## Error Type Support

The ChartError component handles all ApiError types:
- `table_not_found` - Shows additional message about configuration
- `validation_error` - Shows validation error details
- `query_error` - Shows query execution error
- `network_error` - Shows network/connection error
- `permission_error` - Shows permission error

## Files Created

1. `components/charts/chart-skeleton.tsx` - ChartSkeleton component
2. `components/charts/chart-error.tsx` - ChartError component
3. `components/charts/index.ts` - Barrel export for easy importing
