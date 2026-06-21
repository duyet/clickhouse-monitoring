/**
 * Fetch the signed-in principal from `/api/v1/auth/me` so the sidebar user menu
 * can show a real name / email / avatar under reverse-proxy auth.
 *
 * Only runs for the `trusted` and `proxy` providers — for `none` there is no
 * principal, and `clerk` has its own `useUser()`-backed menu (clerk-nav.tsx).
 *
 * The gate reads the RUNTIME provider from `/api/v1/config`
 * (`useFeaturePermissions().config.authProvider`), NOT the build-time
 * `VITE_AUTH_PROVIDER` constant. The published Docker image is built once with
 * the committed default (`clerk`), but each self-hoster selects their provider
 * at deploy time via the runtime `CHM_AUTH_PROVIDER` worker var. Gating on the
 * build-time constant left this feature permanently dead for every proxy/trusted
 * self-hoster on the generic image; the runtime value is the only correct gate.
 */

import { useQuery } from '@tanstack/react-query'

import { useFeaturePermissions } from '@/lib/feature-permissions/context'

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
  // Gate on the runtime provider reported by /api/v1/config, so the published
  // Docker image (built with VITE_AUTH_PROVIDER=clerk) still lights up the
  // sidebar identity when deployed with CHM_AUTH_PROVIDER=trusted|proxy.
  const { config } = useFeaturePermissions()
  const enabled = PROXY_PROVIDERS.has(config.authProvider)
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
