'use client'

import useSWR from 'swr'

interface AuthConfig {
  enabled: boolean
  providers: {
    github: boolean
    google: boolean
  }
}

const fetcher = async (url: string): Promise<AuthConfig> => {
  const res = await fetch(url)
  return res.json() as Promise<AuthConfig>
}

/**
 * Hook to fetch auth configuration from the server
 * Returns which OAuth providers are enabled
 */
export function useAuthConfig() {
  const { data, error, isLoading } = useSWR<AuthConfig>(
    '/api/v1/auth/config',
    fetcher,
    {
      // Cache for 5 minutes, revalidate on focus
      dedupingInterval: 300000,
      revalidateOnFocus: false,
    }
  )

  return {
    isAuthEnabled: data?.enabled ?? false,
    providers: data?.providers ?? { github: false, google: false },
    isLoading,
    error,
  }
}
