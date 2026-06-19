/**
 * Fetch the signed-in principal from `/api/v1/auth/me` so the sidebar user menu
 * can show a real name / email / avatar under reverse-proxy auth.
 *
 * Only runs for the `trusted` and `proxy` providers — for `none` there is no
 * principal, and `clerk` has its own `useUser()`-backed menu (clerk-nav.tsx).
 * The provider is the build-time `VITE_AUTH_PROVIDER` constant, so the query is
 * tree-shaken to a no-op in deployments that don't use proxy auth.
 */

import { useQuery } from '@tanstack/react-query'

export interface AuthIdentity {
  name: string
  email: string
  avatar: string
}

interface MeResponse {
  authenticated: boolean
  principal: {
    subject: string
    name?: string
    email?: string
    avatarUrl?: string
    roles?: string[]
    custom?: Record<string, string>
  } | null
}

const PROXY_PROVIDERS = new Set(['trusted', 'proxy'])

function proxyAuthEnabled(): boolean {
  return PROXY_PROVIDERS.has(import.meta.env.VITE_AUTH_PROVIDER ?? '')
}

async function fetchMe(): Promise<MeResponse | null> {
  const res = await fetch('/api/v1/auth/me', {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) return null
  return (await res.json()) as MeResponse
}

/**
 * Returns the proxy-forwarded identity, or null when unavailable (other auth
 * mode, anonymous, or still loading). Callers fall back to the guest user.
 */
export function useAuthIdentity(): AuthIdentity | null {
  const enabled = proxyAuthEnabled()
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (!enabled || !data?.authenticated || !data.principal) return null

  const { subject, name, email, avatarUrl } = data.principal
  return {
    name: name ?? email ?? subject,
    email: email ?? subject,
    avatar: avatarUrl ?? '',
  }
}
