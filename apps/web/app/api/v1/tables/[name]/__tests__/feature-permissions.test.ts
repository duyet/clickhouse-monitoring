import { describe, expect, test } from 'bun:test'
import {
  featureDisabledByEnv,
  mockAuthorizeFeatureRequest,
} from '@/app/api/v1/__tests__/feature-permissions-mock'

const originalMetricsEnabled = process.env.CHM_FEATURE_METRICS_ENABLED

describe('GET /api/v1/tables/[name] feature permissions', () => {
  test('blocks disabled table query feature before execution', async () => {
    process.env.CHM_FEATURE_METRICS_ENABLED = 'false'
    mockAuthorizeFeatureRequest.mockImplementation(featureDisabledByEnv)

    const { GET } = await import('../route')

    const response = await GET(
      new Request('http://localhost:3000/api/v1/tables/metrics?hostId=0'),
      { params: Promise.resolve({ name: 'metrics' }) }
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
