# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 (React 19) ClickHouse monitoring dashboard that provides real-time insights into ClickHouse clusters through system tables. The application connects to ClickHouse instances and displays metrics, query performance, table information, and cluster health.

## Commands

**Note: This project uses `bun` as the package manager.** Use `bun` instead of `pnpm` or `npm` for all commands.

### Development

- `bun run dev` - Start development server with turbopack
- `bun run build` - Build for production with turbopack
- `bun run start` - Start production server

### Testing

- `bun run test` - Run Jest unit tests with coverage
- `bun run jest` - Run Jest tests (excludes query-config tests)
- `bun run test-queries-config` - Run query config specific tests
- `bun run component` - Open Cypress component tests
- `bun run component:headless` - Run Cypress component tests headless
- `bun run e2e` - Open Cypress e2e tests
- `bun run e2e:headless` - Run Cypress e2e tests headless

### Code Quality

- `bun run lint` - Run Next.js ESLint
- `bun run fmt` - Format code with Prettier

## Architecture

### Core Technologies

- **Next.js 16** with App Router and Turbopack
- **React 19** with TypeScript
- **SWR** for client-side data fetching with caching
- **ClickHouse clients** (@clickhouse/client and @clickhouse/client-web)
- **TanStack Table** for data tables
- **Tailwind CSS** with shadcn/ui components
- **Recharts** and **Tremor** for charting
- **Radix UI** for accessible primitives

### Static Site Architecture

**IMPORTANT**: This application now uses static site generation with query parameter routing.

**Key Changes from SSR to Static:**
- **Routing**: Query parameters (`?host=0`) instead of dynamic routes (`/[host]/`)
- **Data Fetching**: Client-side via SWR instead of server-side
- **Pages**: Pre-rendered as static content with client-side data hydration
- **API**: Separate `/api/v1/*` routes for data fetching

### Routing Pattern

**Old (Dynamic)**: `https://example.com/0/overview`
**New (Static)**: `https://example.com/overview?host=0`

**Benefits:**
- Faster initial page load (static shell pre-rendered)
- Better CDN caching (static pages cache at edge)
- Simpler deployment (standalone output)
- Progressive data loading (client fetches data independently)

### File Structure

```
app/
├── api/v1/              # API routes for data fetching
│   ├── data/            # Generic query endpoint
│   ├── charts/[name]/   # Chart-specific data
│   ├── tables/[name]/   # Table data with pagination
│   └── hosts/           # List available hosts
├── overview/            # Static overview page
├── dashboard/           # Static dashboard page
├── database/            # Static database explorer
├── tables/              # Static tables list
├── clusters/            # Static clusters overview
├── running-queries/     # Static query monitoring pages
├── [query]/             # Dynamic query detail routes
└── layout.tsx           # Root layout with SWR provider

components/
├── data-table/          # Advanced data table system
├── charts/              # Chart components (32 components)
│   └── * (all use SWR with hostId prop)
├── overview-chards/     # Overview page charts
├── header-client.tsx    # Client-side header with host selector
└── ui/                  # shadcn/ui components

lib/
├── api/
│   ├── types.ts         # API request/response types
│   ├── chart-registry.ts # Chart query registry
│   └── table-registry.ts # Table query registry
├── swr/
│   ├── provider.tsx     # SWR configuration
│   ├── use-host.ts      # Extract hostId from query params
│   ├── use-chart-data.ts # Chart data fetching hook
│   └── use-table-data.ts # Table data fetching hook
├── query-config/        # Centralized query configurations
│   ├── queries/         # Query monitoring configs
│   ├── merges/          # Merge operation configs
│   ├── more/            # System metrics configs
│   ├── tables/          # Table-specific configs
│   └── system/          # System-level configs
├── clickhouse.ts        # ClickHouse client (hostId required)
└── server-context.ts    # Server-side context
```

### Multi-Host Support

**IMPORTANT**: All data fetching now requires `hostId` parameter.

**Query Parameter Approach:**
```typescript
// URL: /overview?host=1
'use client'
import { useHostId } from '@/lib/swr'

export default function OverviewPage() {
  const hostId = useHostId() // Returns 1 from query param

  return <OverviewCharts hostId={hostId} />
}
```

**Environment Variables:**
- `CLICKHOUSE_HOST` - Comma-separated list of hosts
- `CLICKHOUSE_USER` - Comma-separated list of users
- `CLICKHOUSE_PASSWORD` - Comma-separated list of passwords
- `CLICKHOUSE_NAME` - Comma-separated list of custom names

### Key Patterns

#### SWR Data Fetching Pattern

**All client components that fetch data follow this pattern:**

```typescript
'use client'
import { Suspense } from 'react'
import { useHostId } from '@/lib/swr'
import { ChartSkeleton } from '@/components/skeleton'
import { YourChart } from '@/components/charts/your-chart'

export default function YourPage() {
  const hostId = useHostId()

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <YourChart hostId={hostId} />
    </Suspense>
  )
}
```

**Chart Components:**
```typescript
'use client'
import useSWR from 'swr'
import { useChartData } from '@/lib/swr/use-chart-data'

export function YourChart({ hostId }: { hostId: number }) {
  const { data, error, isLoading } = useChartData({
    name: 'your-chart-name',
    hostId,
    interval: 300000, // 5 minutes
  })

  if (isLoading) return <ChartSkeleton />
  if (error) return <ChartError error={error} />
  // ... render chart
}
```

#### Data Table System

The `components/data-table/` directory contains a sophisticated table system:

- **Column definitions** with custom formatting (badges, links, duration, etc.)
- **Sorting** with custom sorting functions
- **Pagination** and **filtering**
- **Actions** for row-level operations
- **SQL display** showing the underlying query

#### Query Configuration

Each data view uses a `QueryConfig` type that defines:

- SQL query with parameters
- Column formatting specifications
- Sorting and filtering options
- Actions available for each row

#### Chart Components

Two chart systems are used:

- **Generic charts** in `components/generic-charts/` (area, bar, card-metric, radial)
- **Tremor charts** in `components/tremor/` for specific visualizations

### Development Conventions

#### File Organization

- Server components use `.tsx` without "use client"
- Client components explicitly use "use client" directive
- Page components are in `app/[...]/page.tsx`
- Layout components are in `app/[...]/layout.tsx`
- Config files are named `config.ts` within route directories

#### Component Patterns

- Use Server Components by default
- Client components for interactivity (context, state management)
- Compound components for complex UI (e.g., data tables)
- Custom hooks for shared logic

#### Query Patterns

- All queries include `QUERY_COMMENT` for identification
- Use `fetchData` function for consistent error handling and logging
- Query parameters are properly sanitized through `query_params`
- **CRITICAL**: `fetchData` now requires `hostId` parameter (not optional)
- Client components use SWR hooks for data fetching
- Server components can use API routes for data fetching

#### Table Validation System

The application includes a robust table validation system to handle optional ClickHouse system tables that may not exist depending on configuration:

**Optional Tables** (marked with `optional: true`):

- `system.backup_log` - Only exists if backup configuration is enabled
- `system.error_log` - Requires error logging configuration
- `system.zookeeper` - Only available if ZooKeeper/ClickHouse Keeper is configured
- `system.monitoring_events` - Custom table created by the monitoring application

**Key Components**:

- `lib/table-validator.ts` - Validates table existence before queries
- `lib/table-existence-cache.ts` - Caches validation results (5-minute TTL)
- `lib/error-utils.ts` - Provides user-friendly error messages

**Usage Pattern**:

```typescript
export const backupsConfig: QueryConfig = {
  name: 'backups',
  optional: true, // Mark as optional
  tableCheck: 'system.backup_log', // Explicit table to check
  sql: 'SELECT * FROM system.backup_log',
  // ... other config
}
```

**Automatic Features**:

- SQL parsing automatically extracts table names from complex queries
- Handles JOINs, subqueries, CTEs, and EXISTS clauses
- Graceful error handling with informative user messages
- Caching prevents repeated validation calls

#### Testing Strategy

- **Jest** for unit tests and utilities
  - **Known Issue**: Jest hangs indefinitely in current environment, even with minimal configuration
  - Issue persists with default settings, no ts-jest, no coverage, and bare minimum config
  - Alternative test files (test-without-jest.js) work fine, indicating Node.js environment is functional
  - **CI Workaround**: Jest tests temporarily disabled in GitHub Actions with 5-minute timeout
  - Temporary workaround: Use Cypress for testing until Jest hanging issue is resolved
- **Cypress** for component and e2e tests
- Component tests include visual regression testing
- Test files are co-located with components (`.cy.tsx` files)

## Environment Configuration

### Required Environment Variables

- `CLICKHOUSE_HOST` - ClickHouse host(s)
- `CLICKHOUSE_USER` - ClickHouse user(s)
- `CLICKHOUSE_PASSWORD` - ClickHouse password(s)

### Optional Environment Variables

- `CLICKHOUSE_NAME` - Custom names for hosts
- `CLICKHOUSE_MAX_EXECUTION_TIME` - Query timeout (default: 60s)
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` - Enable Vercel analytics
- `NEXT_PUBLIC_MEASUREMENT_ID` - Google Analytics ID
- `NEXT_PUBLIC_SELINE_ENABLED` - Enable Seline analytics

## Common Tasks

### Adding a New Static Route

1. Create directory in `app/` (e.g., `app/your-route/`)
2. Create `page.tsx` as client component using `useHostId()`
3. Add `QueryConfig` to `lib/query-config/` if needed
4. Add menu item to `menu.ts` with href `/your-route`
5. Use SWR hooks for data fetching

**Template:**
```typescript
// app/your-route/page.tsx
'use client'

import { Suspense } from 'react'
import { RelatedCharts, Table } from '@/components'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { useHostId } from '@/lib/swr'
import { yourConfig } from '@/lib/query-config'

export default function YourRoutePage() {
  const hostId = useHostId()

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts relatedCharts={yourConfig.relatedCharts} hostId={hostId} />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <Table title="Your Data" queryConfig={yourConfig} />
      </Suspense>
    </div>
  )
}
```

### Adding a New Chart Component

1. Create component in `components/charts/your-chart.tsx`
2. Define SQL query in `lib/query-config/` if not exists
3. Use SWR `useChartData` hook with `hostId` prop
4. Handle loading, error, and empty states
5. Export and use in pages or related charts

**Template:**
```typescript
// components/charts/your-chart.tsx
'use client'

import { useChartData } from '@/lib/swr/use-chart-data'
import { ChartSkeleton } from '@/components/skeleton'
import { ChartError } from '@/components/error-alert'

interface YourChartProps {
  hostId: number
  interval?: number
}

export function YourChart({ hostId, interval }: YourChartProps) {
  const { data, error, isLoading } = useChartData({
    name: 'your-chart-name',
    hostId,
    interval,
  })

  if (isLoading) return <ChartSkeleton />
  if (error) return <ChartError error={error} />
  if (!data || data.length === 0) return <div>No data available</div>

  // Render your chart using data
  return <div>{/* Chart rendering */}</div>
}
```

### Modifying Data Tables

- Column formatters are in `components/data-table/cells/`
- Sorting functions are in `components/data-table/sorting-fns.ts`
- Actions are defined in `components/data-table/cells/actions/`

### Working with ClickHouse Queries

- Use `fetchData` for consistent error handling
- All queries should include proper parameter sanitization
- Log query performance through built-in logging
- Use appropriate data formats (JSONEachRow, JSON, etc.)
- **Always pass `hostId` parameter** (required, not optional)

## Important Files

### Core Application
- `next.config.ts` - Next.js configuration (standalone output mode)
- `app/layout.tsx` - Root layout with SWR provider and Suspense
- `app/page.tsx` - Root redirect to `/overview?host=0`
- `components/header-client.tsx` - Client-side header with host selector

### Data Layer
- `lib/clickhouse.ts` - ClickHouse client and `fetchData` (hostId required)
- `lib/swr/use-host.ts` - Extract hostId from query params
- `lib/swr/use-chart-data.ts` - SWR hook for chart data
- `lib/swr/use-table-data.ts` - SWR hook for table data
- `lib/api/chart-registry.ts` - Chart query registry
- `lib/query-config/index.ts` - Centralized query configurations

### Configuration
- `menu.ts` - Navigation menu configuration (static routes)
- `.env.local` - Environment variables for ClickHouse hosts

### Types
- `lib/api/types.ts` - API request/response types
- `types/query-config.ts` - Query configuration types

## Migration Notes

### Completed (Dec 2024)
- Migrated from dynamic `app/[host]/*` routes to static routes with `?host=` query parameter
- All 32 chart components converted to use SWR with `hostId` prop
- API routes created at `/api/v1/*` for data fetching
- Query configs centralized in `lib/query-config/`

### Breaking Changes
- URL structure changed: `/0/overview` → `/overview?host=0`
- `fetchData()` now requires `hostId` parameter (was optional)
- All data fetching moved to client-side via SWR

### Deployment
- Build mode: `output: 'standalone'` (hybrid static + API)
- Deploy to Cloudflare Workers: `npx wrangler login` then `bun run deploy`
