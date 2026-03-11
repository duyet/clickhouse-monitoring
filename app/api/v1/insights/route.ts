/**
 * Insights API Endpoint
 *
 * GET /api/v1/insights
 *
 * Returns AI-generated insights about ClickHouse cluster health,
 * query performance trends, and optimization recommendations.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Request/Response Format
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Query Parameters:
 * - hostId: ClickHouse host identifier (default: 0)
 * - period: Time period for analysis (1h|6h|24h|7d|30d, default: 24h)
 *
 * Response:
 * {
 *   "period": "24h",
 *   "timestamp": 1234567890,
 *   "quickStats": {
 *     "healthScore": 85,
 *     "totalQueries": 12345,
 *     "avgDuration": 45.2,
 *     "activeMerges": 5
 *   },
 *   "insights": [...],
 *   "summary": {
 *     "critical": 0,
 *     "warning": 2,
 *     "info": 3
 *   }
 * }
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { TrendPeriod } from '@/lib/agents/tools/trend-analyzer'

import { generateInsights } from '@/lib/agents/nodes/insight-generator'
import { getInsightsSummary } from '@/lib/agents/tools/trend-analyzer'
import { withApiHandler } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { getAndValidateHostId } from '@/lib/api/shared/validators'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/insights' }

/** Valid period values */
const VALID_PERIODS = ['1h', '6h', '24h', '7d', '30d'] as const

/**
 * Handle GET requests for insights
 *
 * @example
 * GET /api/v1/insights?hostId=0&period=24h
 */
export const GET = withApiHandler(async (request: Request) => {
  // Parse query parameters
  const url = new URL(request.url)
  const params = url.searchParams

  // Get and validate hostId
  const hostId = getAndValidateHostId(params)
  if (typeof hostId !== 'number') {
    return new Response(
      JSON.stringify({ error: { message: hostId.message } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Get and validate period
  const period = params.get('period') ?? '24h'
  if (!VALID_PERIODS.includes(period as TrendPeriod)) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}`,
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Generate insights
    const analysis = await generateInsights(hostId, {
      period: period as TrendPeriod,
    })
    const summary = getInsightsSummary(analysis)

    // Build quick stats
    const quickStats = {
      healthScore: analysis.clusterHealth?.healthScore,
      totalQueries: analysis.queryPerformance?.totalQueries,
      avgDuration: analysis.queryPerformance?.avgDuration,
      activeMerges: analysis.clusterHealth?.activeMerges,
      diskUsage: analysis.clusterHealth?.diskUsage,
    }

    // Return successful response
    return createSuccessResponse(
      {
        period: analysis.period,
        timestamp: analysis.timestamp,
        quickStats,
        insights: analysis.insights,
        summary,
      },
      {
        duration: 0, // Not tracked for insights
      }
    )
  } catch (error) {
    // Handle execution errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return new Response(
      JSON.stringify({
        error: {
          type: 'insights_error',
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}, ROUTE_CONTEXT)
