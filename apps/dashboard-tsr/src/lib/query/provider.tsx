import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

import { useEffect, useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

// Persisted cache settings — see PersistQueryClientProvider below.
//
// localStorage holds ~5 MB per origin. The monitoring dashboard's query
// results (a few rows of system-table metrics per page) are tiny, so the cache
// fits comfortably. Throttle writes so a burst of background refetches doesn't
// serialize the whole cache to disk on every tick.
const PERSIST_KEY = 'chm-tsr-query-cache'
const PERSIST_THROTTLE_MS = 1_000

// Drop the persisted cache after a day so a user returning much later doesn't
// flash stale metrics before the background refetch lands.
const PERSIST_MAX_AGE_MS = 24 * 60 * 60_000

// Invalidate the entire persisted cache on every deploy. A new build can change
// query shapes (columns, version-gated SQL), so rehydrating a previous build's
// data could render against a mismatched schema. The git SHA is inlined at
// build time (see vite.config.ts CLIENT_ENV); 'dev' covers local builds.
const PERSIST_BUSTER = import.meta.env.VITE_GIT_SHA || 'dev'

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SWR dedupingInterval: 5000ms
        // Requests made within this window share the same in-flight fetch
        // and the cached result is considered fresh for this long.
        staleTime: 5_000,

        // Keep inactive (unmounted) query data in cache for 30 min before
        // garbage-collecting it. Orthogonal to staleTime: this does NOT
        // affect freshness — data still revalidates per staleTime — it only
        // controls how long a cached result survives after its last consumer
        // unmounts. A monitoring dashboard hops between pages constantly;
        // with the 5 min default, returning to a page after the GC window
        // shows a loading skeleton. 30 min lets the user navigate back to an
        // instant stale-while-revalidate render (cached data shown, refetch
        // in background) instead of a blank skeleton. (TanStack Query
        // default gcTime is 5 min.)
        //
        // gcTime also bounds what survives a persist round-trip: only queries
        // whose gcTime has not elapsed are restored from localStorage on load.
        gcTime: 30 * 60_000,

        // SWR revalidateOnFocus: false
        // Don't refetch when the browser tab regains focus.
        refetchOnWindowFocus: false,

        // SWR errorRetryCount: 3
        // Retry failed queries up to 3 times before surfacing the error.
        retry: 3,

        // SWR onErrorRetry uses exponential backoff starting at 1 s (errorRetryInterval: 1000),
        // doubling each attempt and capped at 30 s.
        // attempt index is 0-based; match SWR's 2^n * 1000 formula.
        retryDelay: (attempt) => Math.min(30_000, 1_000 * 2 ** attempt),

        // SWR sets no global refreshInterval — polling is opt-in per query.
        // TanStack Query default (false) matches: no background refetch unless
        // the caller passes refetchInterval explicitly.
        refetchInterval: false,
      },
    },
  })
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient)

  // localStorage only exists in the browser. Keep the first client render
  // identical to SSR, then enable persisted query cache after hydration.
  const [persister, setPersister] = useState<ReturnType<
    typeof createSyncStoragePersister
  > | null>(null)

  useEffect(() => {
    setPersister(
      createSyncStoragePersister({
        storage: window.localStorage,
        key: PERSIST_KEY,
        throttleTime: PERSIST_THROTTLE_MS,
      })
    )
  }, [])

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          // Only persist queries that actually succeeded — never cache a
          // pending/errored state to disk (it would rehydrate as a stuck
          // loading or error on next load).
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
