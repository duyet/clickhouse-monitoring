/**
 * Anomaly Detection API Endpoint
 *
 * GET /api/v1/anomalies
 *
 * Performs statistical analysis to detect anomalies in ClickHouse metrics.
 * Compares current values against historical baselines using z-scores and
 * percentile thresholds.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Query Parameters
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * - hostId: ClickHouse host identifier (required)
 * - baselineHours: Time window for baseline calculation (default: 24)
 * - currentHours: Time window for current values (default: 1)
 * - minDeviationPercent: Minimum deviation to trigger alert (default: 50)
 * - zScoreThreshold: Z-score threshold for outlier detection (default: 2.5)
 * - types: Comma-separated list of anomaly types (optional)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AnomalyType } from '@/lib/agents/tools/baseline-analyzer'
import type { ApiRequest } from '@/lib/api/types'

import { analyzeBaselines } from '@/lib/agents/tools/baseline-analyzer'
import {
  createErrorResponse as createApiErrorResponse,
  withApiHandler,
} from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { getAndValidateHostId } from '@/lib/api/shared/validators'
import { ApiErrorType } from '@/lib/api/types'

const ROUTE_CONTEXT = { route: '/api/v1/anomalies' }

/**
 * Supported anomaly types for query parameter validation
 */
const SUPPORTED_ANOMALY_TYPES = [
  'query_spike',
  'memory_anomaly',
  'merge_delay',
  'replication_lag',
  'disk_change',
  'error_rate',
] as const satisfies readonly AnomalyType[]

/**
 * Handle GET requests for anomaly detection
 */
export const GET = withApiHandler(async (request: Request) => {
  // Parse query parameters
  const url = new URL(request.url)
  const hostIdParam = url.searchParams.get('hostId')

  // Validate hostId
  if (!hostIdParam) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'hostId parameter is required',
      },
      400,
      { ...ROUTE_CONTEXT, method: 'GET' }
    )
  }

  const hostId = getAndValidateHostId(url.searchParams)
  if (typeof hostId !== 'number') {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: hostId.message,
      },
      400,
      { ...ROUTE_CONTEXT, method: 'GET' }
    )
  }

  // Parse optional parameters
  const baselineHours = url.searchParams.get('baselineHours')
  const currentHours = url.searchParams.get('currentHours')
  const minDeviationPercent = url.searchParams.get('minDeviationPercent')
  const zScoreThreshold = url.searchParams.get('zScoreThreshold')
  const typesParam = url.searchParams.get('types')

  // Parse anomaly types
  let anomalyTypes: AnomalyType[] | undefined
  if (typesParam) {
    const requestedTypes = typesParam.split(',').map((t) => t.trim())

    // Validate each type
    for (const type of requestedTypes) {
      if (!SUPPORTED_ANOMALY_TYPES.includes(type as AnomalyType)) {
        return createApiErrorResponse(
          {
            type: ApiErrorType.ValidationError,
            message: `Invalid anomaly type: ${type}. Supported types: ${SUPPORTED_ANOMALY_TYPES.join(', ')}`,
          },
          400,
          { ...ROUTE_CONTEXT, method: 'GET' }
        )
      }
    }

    anomalyTypes = requestedTypes as AnomalyType[]
  }

  try {
    // Run baseline analysis
    const result = await analyzeBaselines({
      hostId,
      baselineHours: baselineHours
        ? Number.parseInt(baselineHours, 10)
        : undefined,
      currentHours: currentHours ? Number.parseFloat(currentHours) : undefined,
      minDeviationPercent: minDeviationPercent
        ? Number.parseInt(minDeviationPercent, 10)
        : undefined,
      zScoreThreshold: zScoreThreshold
        ? Number.parseFloat(zScoreThreshold)
        : undefined,
      anomalyTypes,
    })

    return createSuccessResponse(result, {
      duration: result.metadata.analysisDuration,
    })
  } catch (error) {
    // Handle analysis errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: `Anomaly detection failed: ${errorMessage}`,
      },
      500,
      { ...ROUTE_CONTEXT, method: 'GET', hostId }
    )
  }
}, ROUTE_CONTEXT)
