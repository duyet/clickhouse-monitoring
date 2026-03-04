# Development Guide

Patterns and conventions for contributing to the ClickHouse Monitor dashboard.

## Architecture Overview

### Static Site Design

**Critical**: This is a **fully static site** with no server-side rendering. All pages use client-side data fetching via SWR.

**Implications:**
- No `use server()` directives
- No `redirect()` from next/navigation - use `useRouter` + `useEffect`
- All data fetching happens client-side
- Better CDN caching and edge deployment

### Routing Pattern

**Old (Don't Use):**
```
app/[host]/overview/page.tsx  → Dynamic route
URL: /0/overview
```

**New (Use This):**
```
app/overview/page.tsx  → Static route
URL: /overview?host=0
```

**Benefits:**
- Faster initial page load (static shell pre-rendered)
- Better CDN caching
- Simpler deployment
- Progressive data loading

### Project Structure

```
app/
├── api/v1/              # API routes for data fetching
│   ├── data/            # Generic query endpoint
│   ├── charts/[name]/   # Chart-specific data
│   ├── tables/[name]/   # Table data with pagination
│   ├── explorer/        # Data explorer API
│   └── hosts/           # Host configuration
├── overview/            # Static pages with ?host= query param
├── dashboard/
├── explorer/
└── running-queries/

components/
├── data-table/          # Advanced table system
├── charts/              # Chart components (32+)
├── overview-charts/     # Overview page charts
└── ui/                  # shadcn/ui components (DO NOT MODIFY)

lib/
├── api/
│   ├── types.ts         # API request/response types
│   ├── chart-registry.ts # Chart query registry
│   └── table-registry.ts # Table query registry
├── swr/
│   ├── provider.tsx     # SWR configuration
│   ├── use-host.ts      # Extract hostId from query params
│   ├── use-chart-data.ts # Chart data fetching
│   └── use-table-data.ts # Table data fetching
├── query-config/        # Centralized query configurations
├── clickhouse.ts        # ClickHouse client
└── charts/              # Chart query definitions
```

## SWR Data Fetching Pattern

### The Standard Pattern

**All client components that fetch data follow this pattern:**

```typescript
'use client'
import { Suspense } from 'react'
import { useHostId } from '@/lib/swr'
import { ChartSkeleton } from '@/components/skeletons'
import { YourChart } from '@/components/charts/your-chart'

export default function YourPage() {
  const hostId = useHostId() // Extracts ?host= from URL

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <YourChart hostId={hostId} />
    </Suspense>
  )
}
```

### Chart Component Template

```typescript
'use client'
import useSWR from 'swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { ChartSkeleton } from '@/components/skeletons'
import { ChartError } from '@/components/error-alert'

interface YourChartProps {
  hostId: number
  interval?: number
}

export function YourChart({ hostId, interval = 300000 }: YourChartProps) {
  const { data, error, isLoading } = useChartData({
    name: 'your-chart-name',
    hostId,
    interval,
  })

  if (isLoading) return <ChartSkeleton />
  if (error) return <ChartError error={error} />
  if (!data || data.length === 0) return <div>No data available</div>

  // Render chart using recharts, tremor, or custom
  return <div>{/* Chart rendering */}</div>
}
```

### useChartData Hook

```typescript
const { data, error, isLoading } = useChartData({
  name: 'chart-name',     // From chart registry
  hostId: 0,              // Required
  interval: 300000,       // Refresh interval (ms)
  lastHours: 24,          // For historical charts
  params: {               // Optional chart params
    database: 'default',
  },
})
```

### useTableData Hook

```typescript
const { data, error, isLoading } = useTableData({
  queryConfigName: 'running-queries',
  hostId: 0,
  searchParams: {
    pageSize: '50',
    page: '1',
  },
})
```

## Adding a New Route

### Step 1: Create Page Component

Create `app/your-route/page.tsx`:

```typescript
'use client'

import { Suspense } from 'react'
import { useHostId } from '@/lib/swr'
import { ChartSkeleton, TableSkeleton } from '@/components/skeletons'
import { RelatedCharts, Table } from '@/components'

export default function YourRoutePage() {
  const hostId = useHostId()

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts
          relatedCharts={['chart-name-1', 'chart-name-2']}
          hostId={hostId}
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <Table
          title="Your Data"
          queryConfigName="your-query-config"
          hostId={hostId}
        />
      </Suspense>
    </div>
  )
}
```

### Step 2: Add Menu Item

Edit `menu.ts`:

```typescript
{
  title: 'Your Route',
  href: '/your-route',
  description: 'Your route description',
  icon: YourIcon,
  countKey: 'your-count',
  countLabel: 'items',
}
```

### Step 3: Create Query Config (if needed)

Add to `lib/query-config/`:

```typescript
export const yourConfig: QueryConfig = {
  name: 'your-query',
  description: 'Query description',
  sql: 'SELECT database, table FROM system.parts',
  columns: ['database', 'table'],
  columnFormats: {
    database: ColumnFormat.Badge,
    table: ColumnFormat.Text,
  },
}
```

## Adding a New Chart

### Step 1: Define Chart Query

Add to `lib/api/charts/your-domain-charts.ts`:

```typescript
export const yourChart: ChartQueryBuilder = (params) => {
  const lastHours = params.lastHours || 24

  return {
    sql: `
      SELECT
        toStartOfInterval(event_time, INTERVAL 1 hour) AS ts,
        COUNT() AS value
      FROM system.query_log
      WHERE event_time > now() - INTERVAL ${lastHours} HOUR
      GROUP BY ts
      ORDER BY ts
    `,
    columns: ['ts', 'value'],
  }
}

export const yourCharts = {
  'your-chart-name': yourChart,
}
```

### Step 2: Register Chart

Add to `lib/api/chart-registry.ts`:

```typescript
import { yourCharts } from './charts/your-domain-charts'

export const chartRegistry = {
  // ...
  ...yourCharts,
}
```

### Step 3: Create Chart Component

Create `components/charts/your-chart.tsx`:

```typescript
'use client'
import { useChartData } from '@/lib/swr/use-chart-data'
import { ChartSkeleton } from '@/components/skeletons'
import { ChartError } from '@/components/error-alert'
import { AreaChart } from '@/components/charts/area-chart'

export function YourChart({ hostId, interval, lastHours }: YourChartProps) {
  const { data, error, isLoading } = useChartData({
    name: 'your-chart-name',
    hostId,
    interval,
    lastHours,
  })

  if (isLoading) return <ChartSkeleton />
  if (error) return <ChartError error={error} />
  if (!data || data.length === 0) return <div>No data</div>

  return <AreaChart data={data} xKey="ts" yKey="value" />
}
```

## Multi-Host Configuration

### Environment Variables

Configure in `.env.local`:

```bash
# Comma-separated lists (same length)
CLICKHOUSE_HOST=prod.example.com,staging.example.com
CLICKHOUSE_USER=admin,readonly
CLICKHOUSE_PASSWORD=secret123,readonly456
CLICKHOUSE_NAME="Production,Staging"
```

### Accessing Host ID

```typescript
import { useHostId } from '@/lib/swr'

function YourComponent() {
  const hostId = useHostId() // Extracts from ?host= query param

  // URL: /overview?host=1 → hostId = 1 (Staging)
  // URL: /overview?host=0 → hostId = 0 (Production)
}
```

### ClickHouse Client with Host ID

```typescript
import { createClient } from '@clickhouse/client-web'
import { getClickHouseConfig } from '@/lib/clickhouse'

const hostId = 0
const client = createClient(getClickHouseConfig(hostId))
```

## Code Conventions

### Git Commit Format

Follow semantic commit format with consistent scope:

```
feat(scope): description
fix(scope): description
chore(deps): description
refactor(ui): description
docs(api): description
test(unit): description
```

**Always include co-authorship:**
```
Co-Authored-By: duyetbot <duyetbot@users.noreply.github.com>
```

**Examples:**
```
feat(queries): add thread analysis chart
fix(ui): correct chart loading state
chore(deps): upgrade React to 19
docs(api): document streaming endpoint
```

### Component Patterns

**Hooks at deepest consumer:**
```typescript
// Bad: Prop drilling hostId
function Nav({ hostId }: { hostId: number }) {
  return <MenuItem hostId={hostId} />
}

// Good: Hook at deepest consumer
function Nav() {
  return <MenuItem />
}

function MenuItem() {
  const hostId = useHostId() // Call where needed
  return <a href={`/overview?host=${hostId}`}>Overview</a>
}
```

**Client Components:**
- Always add `'use client'` directive
- Use Suspense for loading states
- Handle errors gracefully

**Server Components:**
- Don't use `'use client'` (default in Next.js)
- Keep mostly static (no data fetching)
- For this project: Most pages are client components

### shadcn/ui Components

**DO NOT modify** `components/ui/` files directly. These are installed via CLI and should remain in original state.

**If you need custom styling:**
```typescript
// Good: Custom classes at usage site
<Card className="hover:shadow-lg transition-all">
  <CardContent>...</CardContent>
</Card>

// Bad: Modifying components/ui/card.tsx
```

**For reusable custom variants:**
```typescript
// Create wrapper in components/ (not components/ui/)
// components/info-badge.tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function InfoBadge({ className, ...props }) {
  return (
    <Badge
      className={cn(
        'border-transparent bg-blue-100 text-blue-800',
        className
      )}
      {...props}
    )
  )
}
```

## Testing

### Unit Tests with Jest

```bash
bun run test           # Run all tests with coverage
bun run jest           # Run Jest (excludes query-config tests)
bun run test-queries-config  # Test query configs only
```

### Component Tests with Cypress

```bash
bun run component           # Open Cypress component tests
bun run component:headless  # Run headless
```

### E2E Tests

```bash
bun run e2e           # Open Cypress e2e
bun run e2e:headless  # Run headless
```

### Build Verification

After changes, always run:
```bash
bun run build
```

This includes TypeScript type checking via `tsc`.

## Deployment

### Local Development

```bash
bun install    # Install dependencies
bun run dev    # Start dev server with turbopack
```

### Production Build

```bash
bun run build  # Build standalone output
bun run start  # Start production server
```

### Docker Deployment

```bash
docker build -t clickhouse-monitor .
docker run -p 3000:3000 --env-file .env.local clickhouse-monitor
```

### Cloudflare Workers Deployment

```bash
bun run cf:deploy    # Build and deploy
bun run cf:build     # Build only
bun run cf:config    # Set secrets from .env.local
```

## Troubleshooting Development

### Common Issues

**Build fails with TypeScript errors:**
- Check `bun run build` output
- Fix type errors in indicated files
- Ensure imports are correct

**SWR not refetching:**
- Check `interval` is set correctly
- Verify API endpoint returns data
- Check network tab for failed requests

**Charts show "No data available":**
- Verify ClickHouse table exists and has data
- Check query is valid for ClickHouse version
- See `docs/clickhouse-schemas/` for table requirements

**Multi-host not working:**
- Verify all environment arrays have same length
- Check `CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`
- Use comma-separated values

## See Also

- [API Endpoints Reference](api-endpoints.md) - Complete API documentation
- [ClickHouse Compatibility](clickhouse-compat.md) - Version-aware queries
- [Project Repository](https://github.com/duyet/clickhouse-monitor)
