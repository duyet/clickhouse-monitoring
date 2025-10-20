/**
 * Health check endpoint with memory metrics
 * GET /api/health - Returns system health and memory usage statistics
 */

import {
  getHealthMetrics,
  isMemoryCritical,
  isMemoryWarning,
} from '@/lib/memory-monitor'

export async function GET() {
  try {
    const metrics = getHealthMetrics()
    const warning = isMemoryWarning()
    const critical = isMemoryCritical()

    return Response.json(
      {
        status: critical ? 'critical' : warning ? 'warning' : 'ok',
        timestamp: new Date().toISOString(),
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
