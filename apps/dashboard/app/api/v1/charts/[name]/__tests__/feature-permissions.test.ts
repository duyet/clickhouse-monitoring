import { describe, expect, test } from 'bun:test'
import {
  featureDisabledByEnv,
  mockAuthorizeFeatureRequest,
} from '@/app/api/v1/__tests__/feature-permissions-mock'

const originalMetricsEnabled = process.env.CHM_FEATURE_METRICS_ENABLED

describe('GET /api/v1/charts/[name] feature permissions', () => {
  test('blocks disabled chart feature before execution', async () => {
    process.env.CHM_FEATURE_METRICS_ENABLED = 'false'
    mockAuthorizeFeatureRequest.mockImplementation(featureDisabledByEnv)

    // Configure chart-registry mock to return a queryDef with permission
    const { getChartQuery, hasChart } = await import('@/lib/api/chart-registry')
    if (typeof hasChart === 'function' && 'mockReturnValue' in hasChart) {
      hasChart.mockReturnValue(true)
    }
    if (
      typeof getChartQuery === 'function' &&
      'mockReturnValue' in getChartQuery
    ) {
      getChartQuery.mockReturnValue({
        query: 'SELECT 1',
        queryParams: undefined,
        permission: { feature: 'metrics' },
      })
    }

    const { GET } = await import('../route')

    const response = await GET(
      new Request('http://localhost:3000/api/v1/charts/cpu-usage?hostId=0'),
      { params: Promise.resolve({ name: 'cpu-usage' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')

    // Restore
    if (originalMetricsEnabled === undefined) {
      delete process.env.CHM_FEATURE_METRICS_ENABLED
    } else {
      process.env.CHM_FEATURE_METRICS_ENABLED = originalMetricsEnabled
    }
    mockAuthorizeFeatureRequest.mockResolvedValue(null)
  })
})
