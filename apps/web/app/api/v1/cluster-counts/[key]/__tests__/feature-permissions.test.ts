import { describe, expect, test } from 'bun:test'
import {
  featureDisabledByEnv,
  mockAuthorizeFeatureRequest,
} from '@/app/api/v1/__tests__/feature-permissions-mock'

const originalClusterEnabled = process.env.CHM_FEATURE_CLUSTER_ENABLED

describe('GET /api/v1/cluster-counts/[key] feature permissions', () => {
  test('blocks disabled cluster count feature before execution', async () => {
    process.env.CHM_FEATURE_CLUSTER_ENABLED = 'false'
    mockAuthorizeFeatureRequest.mockImplementation(featureDisabledByEnv)

    const { GET } = await import('../route')

    const response = await GET(
      new Request(
        'http://localhost:3000/api/v1/cluster-counts/readonly-tables-in-cluster?hostId=0&cluster=default'
      ),
      {
        params: Promise.resolve({ key: 'readonly-tables-in-cluster' }),
      }
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')

    // Restore
    if (originalClusterEnabled === undefined) {
      delete process.env.CHM_FEATURE_CLUSTER_ENABLED
    } else {
      process.env.CHM_FEATURE_CLUSTER_ENABLED = originalClusterEnabled
    }
    mockAuthorizeFeatureRequest.mockResolvedValue(null)
  })
})
