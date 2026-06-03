import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'

function getDeploymentInfo(bindings: Record<string, string | undefined>) {
  // Determine runtime: in workerd the CLOUDFLARE_WORKERS binding is set to '1'
  const runtime = bindings.CLOUDFLARE_WORKERS === '1' ? 'cloudflare' : 'node'

  return {
    gitSha: bindings.NEXT_PUBLIC_GIT_SHA ?? null,
    gitRef: bindings.NEXT_PUBLIC_GIT_REF ?? null,
    buildTimestamp: bindings.NEXT_PUBLIC_BUILD_TIMESTAMP ?? null,
    ci: bindings.NEXT_PUBLIC_CI === 'true',
    runtime,
    // Auth provider as set at build time (NEXT_PUBLIC_AUTH_PROVIDER) and
    // at runtime (CHM_AUTH_PROVIDER). The source route used @/lib/auth/provider
    // which is not yet in dashboard-tsr, so we read the env vars directly.
    authProvider:
      bindings.CHM_AUTH_PROVIDER ?? bindings.NEXT_PUBLIC_AUTH_PROVIDER ?? null,
    clientAuthProvider: bindings.NEXT_PUBLIC_AUTH_PROVIDER ?? null,
    agentAccess: bindings.CHM_FEATURE_AGENT_ACCESS ?? 'public',
    clerkPublishableKeyPrefix:
      bindings.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 8) ?? null,
  }
}

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => {
        try {
          const bindings = env as Record<string, string | undefined>

          return Response.json(
            {
              status: 'ok',
              timestamp: new Date().toISOString(),
              deployment: getDeploymentInfo(bindings),
            },
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            }
          )
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          return Response.json(
            {
              status: 'error',
              error: errorMessage,
              timestamp: new Date().toISOString(),
            },
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        }
      },
    },
  },
})
