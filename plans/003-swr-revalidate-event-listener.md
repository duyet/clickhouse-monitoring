# Plan 003: Wire swr:revalidate Event Listener to TanStack Query Client

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/src/lib/query/provider.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The dashboard application has migrated from SWR to TanStack Query. Manual reload features (the countdown timer, manual refresh button, and keyboard shortcuts) trigger revalidation by dispatching a custom `swr:revalidate` event on the global `window` object. 

Because TanStack Query's `QueryProvider` does not listen for this custom event, manual revalidation and auto-refresh intervals are currently non-functional in the new `dashboard-tsr` application. Wire up an event listener in the `QueryProvider` that intercepts the event and invalidates active queries in the TanStack Query client.

## Current state

The file `apps/dashboard-tsr/src/lib/query/provider.tsx` defines the `QueryProvider` component, which initializes and hosts the `QueryClient`:

```typescript
// apps/dashboard-tsr/src/lib/query/provider.tsx:76-83
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient)

  // localStorage only exists in the browser. Keep the first client render
  // identical to SSR, then enable persisted query cache after hydration.
  const [persister, setPersister] = useState<ReturnType<
    typeof createSyncStoragePersister
  > | null>(null)
  // ...
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `cd apps/dashboard-tsr && bun run type-check` | exit 0, no errors |
| Test      | `cd apps/dashboard-tsr && bun test src/` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `apps/dashboard-tsr/src/lib/query/provider.tsx`
- `apps/dashboard-tsr/src/lib/query/__tests__/provider.test.tsx` (create)

**Out of scope**:
- Modifications to `refresh-countdown.tsx` or `use-shortcut-handlers.ts`. They should continue to dispatch `swr:revalidate` so all consumers are updated together.

## Git workflow

- Branch: `advisor/003-swr-revalidate-event-listener`
- Commit message: `fix(dashboard-tsr): listen for swr:revalidate event to refresh TanStack Query cache`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Add the event listener to QueryProvider

Open [provider.tsx](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/lib/query/provider.tsx) and add a `useEffect` inside `QueryProvider` that listens for the `swr:revalidate` custom event and calls `queryClient.invalidateQueries({ type: 'active' })`.

Target implementation snippet:
```typescript
  // Listen for the custom "swr:revalidate" event to trigger TanStack Query revalidations.
  // This supports the manual refresh button, auto-refresh countdown, and hotkeys.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleRevalidate = () => {
      queryClient.invalidateQueries({ type: 'active' })
    }

    window.addEventListener('swr:revalidate', handleRevalidate)
    return () => {
      window.removeEventListener('swr:revalidate', handleRevalidate)
    }
  }, [queryClient])
```

**Verify**: `cd apps/dashboard-tsr && bun run type-check` returns exit 0.

### Step 2: Create a unit test for revalidation listener

Create a new test file at `apps/dashboard-tsr/src/lib/query/__tests__/provider.test.tsx` to verify that dispatching the `swr:revalidate` event successfully invalidates active queries in the QueryClient.

Sample test structure:
```typescript
import { describe, expect, it, spyOn } from 'bun:test'
import { render } from '@testing-library/react' // or test using standard React/hooks assertions
import { QueryProvider } from '../provider'
import { useQuery } from '@tanstack/react-query'

// Add standard unit tests validating:
// 1. Component renders correctly.
// 2. CustomEvent "swr:revalidate" is captured and invalidation runs.
```
*(Note: If `@testing-library/react` is not installed or configured in dashboard-tsr, you can test by importing QueryClient directly or instantiating a wrapper to verify EventListener bindings).*

Let's do a simple unit test that doesn't require complex UI testing if possible, or mocks window event listener registration.
```typescript
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { QueryProvider } from '../provider'
import React from 'react'

describe('QueryProvider EventListener', () => {
  it('registers swr:revalidate event listener on mount', () => {
    const addSpy = spyOn(window, 'addEventListener')
    const removeSpy = spyOn(window, 'removeEventListener')

    // test mounting/unmounting registers/removes the listener
  })
})
```

**Verify**: `cd apps/dashboard-tsr && bun test src/lib/query/__tests__/provider.test.tsx` passes.

## Test plan

- Run `cd apps/dashboard-tsr && bun test src/lib/query/__tests__/provider.test.tsx`
- Ensure tests verify both the listener registration/unregistration and the call to `queryClient.invalidateQueries`.

## Done criteria

- [ ] `cd apps/dashboard-tsr && bun run type-check` exits 0.
- [ ] `cd apps/dashboard-tsr && bun test src/lib/query/__tests__/provider.test.tsx` passes.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If `QueryProvider` fails to mount due to hydration or edge environment issues during unit tests.
- If invalidating query cache results in infinite loops.

## Maintenance notes

- When eventually SWR codebase is 100% decommissioned, this custom event name can be refactored to `query:revalidate` or replaced with direct TanStack Query client interactions, but keeping it as `swr:revalidate` minimizes changes during the migration period.
