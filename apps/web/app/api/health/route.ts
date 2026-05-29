/**
 * Health check endpoint with memory metrics
 * GET /api/health - Returns system health and memory usage statistics
 */

import { getAuthProvider, isAuthProviderConfigError } from '@/lib/auth/provider'
import {
  getHealthMetrics,
  isMemoryCritical,
  isMemoryWarning,
} from '@/lib/memory-monitor'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

function getDeploymentInfo() {
  let authProvider: string
  try {
    authProvider = getAuthProvider()
  } catch (err) {
    authProvider = isAuthProviderConfigError(err) ? 'invalid' : 'unknown'
  }

  return {
    gitSha: process.env.NEXT_PUBLIC_GIT_SHA ?? null,
    gitRef: process.env.NEXT_PUBLIC_GIT_REF ?? null,
    buildTimestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? null,
    ci: process.env.NEXT_PUBLIC_CI === 'true',
    runtime: process.env.CLOUDFLARE_WORKERS === '1' ? 'cloudflare' : 'node',
    authProvider,
    clientAuthProvider: process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? null,
    agentAccess: process.env.CHM_FEATURE_AGENT_ACCESS ?? 'public',
    clerkPublishableKeyPrefix:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 8) ?? null,
  }
}

export async function GET() {
  try {
    const metrics = getHealthMetrics()
    const warning = isMemoryWarning()
    const critical = isMemoryCritical()

    return Response.json(
      {
        status: critical ? 'critical' : warning ? 'warning' : 'ok',
        timestamp: new Date().toISOString(),
        deployment: getDeploymentInfo(),
        metrics,
        alerts: {
          memoryWarning: warning,
          memoryCritical: critical,
        },
      },
      {
        status: critical ? 503 : warning ? 206 : 200,
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
}
