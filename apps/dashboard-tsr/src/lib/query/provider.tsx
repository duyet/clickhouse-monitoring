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
