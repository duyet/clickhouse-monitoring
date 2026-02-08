# Skeleton Component Guidelines

This document describes the standardized skeleton components and usage patterns for loading states.

## Available Skeletons

### Base Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-32" />
```

### Purpose-Specific Skeletons

| Component | Usage | Import |
|-----------|-------|--------|
| `ChartSkeleton` | Chart loading states | `@/components/skeletons` |
| `ExplorerSkeleton` | Database explorer page | `@/components/skeletons` |
| `PageSkeleton` | Full page with charts and table | `@/components/skeletons` |
| `ChartsOnlyPageSkeleton` | Page with only charts | `@/components/skeletons` |
| `TableOnlyPageSkeleton` | Page with only table | `@/components/skeletons` |
| `RedirectSkeleton` | Redirect/loading page | `@/components/skeletons` |
| `SidebarSkeleton` | Sidebar navigation | `@/components/skeletons` |
| `TableSkeleton` | Data table | `@/components/skeletons` |
| `TabsSkeleton` | Tab navigation | `@/components/skeletons` |
| `SingleLineSkeleton` | Single text line | `@/components/skeletons` |
| `MultiLineSkeleton` | Multiple text lines | `@/components/skeletons` |
| `ListSkeleton` | List items | `@/components/skeletons` |

## Usage Patterns

### Page-Level Skeletons

```tsx
'use client'

import { Suspense } from 'react'
import { PageSkeleton } from '@/components/skeletons'
import { YourPageContent } from '@/components/your-page'

export default function YourPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <YourPageContent />
    </Suspense>
  )
}
```

### Chart Skeletons

```tsx
import { ChartSkeleton } from '@/components/skeletons'

<ChartSkeleton title="Query Performance" />
```

### Table Skeletons

```tsx
import { TableSkeleton } from '@/components/skeletons'

<TableSkeleton rows={10} cols={5} />
```

### Redirect Skeletons

```tsx
import { RedirectSkeleton } from '@/components/skeletons'

<RedirectSkeleton
  title="Loading..."
  description="Please wait while we redirect..."
/>
```

## Accessibility

All skeletons include:
- `role="status"` - Indicates loading state
- `aria-busy="true"` - Marks content as being updated
- `aria-label` - Descriptive label for screen readers
- `sr-only` text - Additional context for screen readers

## Design Guidelines

### Dimensions

| Element | Height | Width |
|---------|--------|-------|
| Text sm | `h-3` | variable |
| Text base | `h-4` | variable |
| Text lg | `h-5` | variable |
| Button | `h-8` or `h-9` | `w-20` to `w-32` |
| Input | `h-9` or `h-10` | variable |
| Card | `h-full` or specific | `w-full` |

### Animation

All skeletons use the default `animate-pulse` from shadcn/ui for a subtle loading animation.

### Color

Skeletons inherit from `bg-muted` and use `animate-pulse` for the loading effect.

## Adding New Skeletons

When adding a new skeleton component:

1. **Name it descriptively**: `{Purpose}Skeleton`
2. **Match the actual layout**: Prevent CLS by matching real dimensions
3. **Include accessibility**: Add `role="status"` and `aria-label`
4. **Export from index**: Add to `@/components/skeletons/index.tsx`

Example:
```tsx
// components/skeletons/dashboard.tsx
'use client'

import { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard">
      {/* Match actual dashboard layout */}
    </div>
  )
})
```

## Performance Notes

- Skeletons are memoized with `React.memo` to prevent unnecessary re-renders
- Use specific skeletons (e.g., `ChartSkeleton`) instead of generic `<Skeleton>` for better consistency
- Skeletons add minimal bundle size (<1KB gzipped)
