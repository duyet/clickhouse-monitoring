import { describe, expect, test } from 'bun:test'
import {
  featureDisabledByEnv,
  mockAuthorizeFeatureRequest,
} from '@/app/api/v1/__tests__/feature-permissions-mock'

const originalSettingsEnabled = process.env.CHM_FEATURE_SETTINGS_ENABLED

describe('/api/v1/dashboard/settings feature permissions', () => {
  test('blocks disabled settings reads before execution', async () => {
    process.env.CHM_FEATURE_SETTINGS_ENABLED = 'false'
    mockAuthorizeFeatureRequest.mockImplementation(featureDisabledByEnv)

    const { GET } = await import('../route')

    const response = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')

    // Restore
    if (originalSettingsEnabled === undefined) {
      delete process.env.CHM_FEATURE_SETTINGS_ENABLED
    } else {
      process.env.CHM_FEATURE_SETTINGS_ENABLED = originalSettingsEnabled
    }
    mockAuthorizeFeatureRequest.mockResolvedValue(null)
  })

  test('blocks disabled settings writes before execution', async () => {
    process.env.CHM_FEATURE_SETTINGS_ENABLED = 'false'
    mockAuthorizeFeatureRequest.mockImplementation(featureDisabledByEnv)

    const { POST } = await import('../route')

    const response = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'dark' }, hostId: 0 }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')

    // Restore
    if (originalSettingsEnabled === undefined) {
      delete process.env.CHM_FEATURE_SETTINGS_ENABLED
    } else {
      process.env.CHM_FEATURE_SETTINGS_ENABLED = originalSettingsEnabled
    }
    mockAuthorizeFeatureRequest.mockResolvedValue(null)
  })
})
