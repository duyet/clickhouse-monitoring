// @ts-nocheck — test helper, only runs under bun:test
import { mock } from 'bun:test'

/**
 * Shared mock for `@/lib/feature-permissions/server`'s `authorizeFeatureRequest`.
 *
 * PROBLEM: bun:test's `mock.module()` is process-global. Multiple API route
 * test files mock `@/lib/feature-permissions/server` — the last registration
 * wins for ALL files. Route tests need it to always return `null` (bypass
 * permission checks), while feature-permission tests need it to actually
 * enforce the env-var-based permission logic.
 *
 * SOLUTION: Single `mock.module()` registration backed by a shared mock
 * function. Each test configures behavior per-test via `mockImplementation()`.
 *
 * USAGE:
 *   // Route tests (bypass permissions):
 *   import { mockAuthorizeFeatureRequest } from './feature-permissions-mock'
 *   mockAuthorizeFeatureRequest.mockResolvedValue(null)
 *
 *   // Feature-permission tests (enforce disable check):
 *   mockAuthorizeFeatureRequest.mockImplementation(featureDisabledByEnv)
 *
 *   // Agent auth tests (enforce auth check):
 *   mockAuthorizeFeatureRequest.mockImplementation(agentAuthFromEnv)
 */

export const mockAuthorizeFeatureRequest = mock(
  async (
    _permission?: unknown,
    _request?: unknown,
    _options?: unknown
  ): Promise<Response | null> => {
    // Default: allow everything (route tests call mockResolvedValue(null) in beforeEach)
    return null
  }
)

mock.module('@/lib/feature-permissions/server', () => ({
  authorizeFeatureRequest: mockAuthorizeFeatureRequest,
}))

/**
 * Mock implementation that checks `CHM_FEATURE_<FEATURE>_ENABLED` env var.
 * Returns a 404 FEATURE_DISABLED response when the env var is 'false'.
 */
export async function featureDisabledByEnv(
  permission: { feature: string } | undefined
): Promise<Response | null> {
  if (!permission) return null
  const envKey = `CHM_FEATURE_${permission.feature.toUpperCase()}_ENABLED`
  if (process.env[envKey] === 'false') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'FEATURE_DISABLED',
          message: `Feature "${permission.feature}" is disabled.`,
        },
      }),
      {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }
    )
  }
  return null
}

/**
 * Mock implementation that simulates the real authorizeFeatureRequest behavior
 * for agent auth tests. Checks:
 * 1. Feature disabled via CHM_FEATURE_<FEATURE>_ENABLED=false → 404
 * 2. Feature access authenticated via CHM_FEATURE_<FEATURE>_ACCESS=authenticated
 *    AND auth provider is clerk → checks Bearer token or Clerk session
 * 3. Otherwise → null (allow)
 */
export function agentAuthFromEnv(
  getClerkUserId: () => string | null,
  agentApiToken?: string
) {
  return async (
    permission: { feature: string } | undefined,
    request?: Request,
    options?: { allowAgentBearerToken?: boolean }
  ): Promise<Response | null> => {
    if (!permission) return null

    const feature = permission.feature
    const enabledEnvKey = `CHM_FEATURE_${feature.toUpperCase()}_ENABLED`
    const accessEnvKey = `CHM_FEATURE_${feature.toUpperCase()}_ACCESS`

    // Check if feature is disabled
    if (process.env[enabledEnvKey] === 'false') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FEATURE_DISABLED',
            message: `Feature "${feature}" is disabled.`,
          },
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }
      )
    }

    // Check if feature requires authentication
    const access = process.env[accessEnvKey]
    const authProvider =
      process.env.CHM_AUTH_PROVIDER ?? process.env.NEXT_PUBLIC_AUTH_PROVIDER

    if (access === 'authenticated' && authProvider === 'clerk') {
      // Check Bearer token
      if (options?.allowAgentBearerToken && agentApiToken) {
        const authHeader = request?.headers.get('authorization') ?? ''
        const match = authHeader.match(/^bearer\s+(.+)$/i)
        if (match && match[1] === agentApiToken) {
          return null
        }
      }

      // Check Clerk session
      const userId = getClerkUserId()
      if (userId) {
        return null
      }

      // Not authenticated
      return new Response(
        JSON.stringify({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: `Feature "${feature}" requires authentication.`,
          },
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json',
            'www-authenticate': 'Bearer',
          },
        }
      )
    }

    return null
  }
}
