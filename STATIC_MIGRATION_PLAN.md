# Static Site Migration Plan

## Current State Analysis

### SSR Dependencies Blocking Static Export

1. **Dynamic Route: `app/[host]`**
   - All pages are under dynamic `[host]` segment
   - Pages are generated server-side based on URL parameter
   - Uses `params: Promise<{ host: string }>` in layouts

2. **Server-Only Context: `lib/server-context.ts`**
   - Uses `server-only-context` package
   - Exports `getHostId()` and `setHostId()` for server components
   - Called from `lib/clickhouse.ts:getClient()` and `components/clickhouse-host.tsx`

3. **Server Actions: `lib/scoped-link.ts`**
   - Uses Next.js `cookies()` from `next/headers`
   - `getHostIdCookie()` reads hostId from cookies
   - `getScopedLink()` and `redirectScoped()` depend on server-side cookie access
   - Used in 26 files across components and pages

4. **Cookie-Based Host Persistence**
   - `app/[host]/layout.tsx` sets cookie via `<Script>` tag
   - Falls back to server context when cookies unavailable

### What's Already Migrated

✅ **API Routes** (`app/api/v1/*`)
- `/api/v1/charts/[name]` - Chart data endpoints
- `/api/v1/data` - Generic table data endpoint
- `/api/v1/hosts` - Host configuration endpoint
- `/api/v1/tables/[name]` - Table data endpoints

✅ **Chart Components** - Many converted to Client + SWR pattern
- `components/charts/summary-*.tsx` using `useChartData` hook
- `lib/swr/use-chart-data.ts` for client-side data fetching

✅ **Table Components** - Many converted to TableClient pattern
- `components/data-table/TableClient.tsx` for client-side rendering

## Migration Strategy

### Approach: Client-Side Host Management

Move host selection from URL structure to client-side state management:

**Current URL Pattern:** `/{hostId}/overview`, `/{hostId}/dashboard`, etc.
**New URL Pattern:** `/overview?host=0`, `/dashboard?host=0`, etc.

### Phase 1: Client-Side Host Context

1. **Extend `app/context.tsx`**
   - Add `hostId: number` to ContextValue interface
   - Initialize from URL search param or localStorage
   - Persist changes to both URL and localStorage

```typescript
// app/context.tsx additions
interface ContextValue {
  // ... existing
  hostId: number
  setHostId: (hostId: number) => void
}
```

2. **Create client-side host utility**
   - Replace `lib/server-context.ts` with `lib/host-context.ts`
   - Provide `useHostId()` hook for components
   - Handle URL param synchronization

### Phase 2: Replace ScopedLink

1. **Create `lib/client-link.ts`**
   - Client-side replacement for `lib/scoped-link.ts`
   - Use `useSearchParams()` and `useRouter()` hooks
   - Preserve existing hostId when navigating

```typescript
// lib/client-link.ts
export function useHostedLink() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const hostId = searchParams.get('host') || '0'

  const buildLink = (path: string) => {
    return `${path}?host=${hostId}`
  }

  const navigate = (path: string) => {
    router.push(buildLink(path))
  }

  return { hostId, buildLink, navigate }
}
```

2. **Update all imports**
   - Replace `from '@/lib/scoped-link'` with `from '@/lib/client-link'`
   - Update 26 files using scoped-link utilities

### Phase 3: Refactor ClickHouse Client

1. **Update `lib/clickhouse.ts`**
   - Remove `getHostId()` import from server-context
   - Make `hostId` required parameter for `fetchData()`
   - Update all callers to pass hostId explicitly

```typescript
// lib/clickhouse.ts changes
export const fetchData = async <T>({
  query,
  hostId, // Make required, remove getHostId() fallback
  // ...
}: QueryParams & { hostId: number }): Promise<FetchDataResult<T>> => {
  // Use hostId directly, no getHostId() call
}
```

2. **Update `getClient()` function**
   - Remove `getHostId()` fallback
   - Make `hostId` required when no `clientConfig` provided

### Phase 4: Migrate Route Structure

1. **Create new static routes under `app/`**
   - Move `app/[host]/overview/page.tsx` → `app/overview/page.tsx`
   - Move `app/[host]/dashboard/page.tsx` → `app/dashboard/page.tsx`
   - Continue for all routes

2. **Update page components**
   - Remove `params: Promise<{ host: string }>` prop
   - Use `useHostId()` hook instead
   - Update API calls to pass hostId

3. **Handle root redirect**
   - Update `app/page.tsx` to redirect to `/overview?host=0`

### Phase 5: Update Components

1. **Convert `components/clickhouse-host.tsx`**
   - Remove `'use server'` directive (if present)
   - Change from async server component to client component
   - Use `useHostId()` hook instead of `getHostId()`
   - Fetch host status via API instead of direct ClickHouse call

2. **Update `app/[host]/layout.tsx`**
   - Move to `app/layout.tsx` (merge with existing root layout)
   - Remove cookie script injection
   - Remove server context setup
   - Keep `PageView` and `BackgroundJobs` (make them client-side)

### Phase 6: Configuration Changes

1. **Update `next.config.ts`**
```typescript
const nextConfig: NextConfig = {
  output: 'export',  // Change from 'standalone'
  // Remove standalone-specific settings
  // Keep other config options
}
```

2. **Remove unused dependencies**
   - `server-only-context` package
   - Any other server-only dependencies

3. **Update API routes**
   - Ensure all dynamic endpoints are under `app/api/`
   - Keep `force-dynamic` for API routes that need it

## Implementation Order

### Step 1: Foundation (No Breaking Changes)
1. Extend `app/context.tsx` with hostId state
2. Create `lib/client-link.ts` utility
3. Create `lib/host-context.ts` for backwards compatibility

### Step 2: Data Layer Updates
1. Update `lib/clickhouse.ts` to require hostId parameter
2. Update API routes to handle hostId from query params
3. Add `useHostId()` hook implementation

### Step 3: Component Updates
1. Convert `components/clickhouse-host.tsx` to client component
2. Update all scoped-link usages (26 files)
3. Update components that use `getHostId()`

### Step 4: Route Migration (Breaking Changes)
1. Create parallel static routes
2. Migrate pages one by one
3. Update navigation and links
4. Remove old `app/[host]` directory

### Step 5: Final Configuration
1. Update `next.config.ts` for static export
2. Test production build
3. Verify all functionality works
4. Deploy and validate

## File Changes Summary

### Files to Modify
- `app/context.tsx` - Add hostId state
- `lib/clickhouse.ts` - Remove server-context dependency
- `next.config.ts` - Change to static export
- `components/clickhouse-host.tsx` - Convert to client component
- 26 files using `scoped-link` - Update imports and usage

### Files to Create
- `lib/client-link.ts` - Client-side link utility
- `lib/host-context.ts` - HostId hook and utilities

### Files to Remove
- `lib/server-context.ts` - No longer needed
- `lib/scoped-link.ts` - Replaced by client-link
- `app/[host]/` - Entire directory after migration

### Files to Move
- All pages from `app/[host]/*/page.tsx` → `app/*/page.tsx`
- `app/[host]/layout.tsx` → Merge into `app/layout.tsx`

## Testing Strategy

1. **Unit Tests**
   - Update `lib/__tests__/fetchdata-hostid.test.ts`
   - Update `lib/__tests__/clickhouse-helpers.test.ts`
   - Add tests for client-link utilities

2. **Integration Tests**
   - Test host switching functionality
   - Test URL param persistence
   - Test API calls with different hostIds

3. **E2E Tests**
   - Run Cypress tests after migration
   - Verify all user flows work
   - Test multi-host scenarios

## Rollback Plan

If issues arise:
1. Keep `app/[host]` directory until migration is verified
2. Use feature flags to switch between old/new implementations
3. Revert `next.config.ts` to `standalone` mode if needed
4. Gradual migration: migrate one route at a time

## Success Criteria

✅ Production build succeeds with `output: 'export'`
✅ Static HTML/CSS/JS files generated in `out/` directory
✅ Can deploy to static hosting (Cloudflare Pages, Netlify, etc.)
✅ All existing functionality works (multi-host, charts, tables)
✅ No server-side code in client bundles
✅ API routes work as expected
✅ E2E tests pass
