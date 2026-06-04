import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
