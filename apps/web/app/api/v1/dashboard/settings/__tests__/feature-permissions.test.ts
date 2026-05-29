import { GET, POST } from '../route'
import { afterEach, describe, expect, test } from 'bun:test'

const originalSettingsEnabled = process.env.CHM_FEATURE_SETTINGS_ENABLED

afterEach(() => {
  if (originalSettingsEnabled === undefined) {
    delete process.env.CHM_FEATURE_SETTINGS_ENABLED
  } else {
    process.env.CHM_FEATURE_SETTINGS_ENABLED = originalSettingsEnabled
  }
})

describe('/api/v1/dashboard/settings feature permissions', () => {
  test('blocks disabled settings reads before execution', async () => {
    process.env.CHM_FEATURE_SETTINGS_ENABLED = 'false'

    const response = await GET(
      new Request('http://localhost:3000/api/v1/dashboard/settings?hostId=0')
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')
  })

  test('blocks disabled settings writes before execution', async () => {
    process.env.CHM_FEATURE_SETTINGS_ENABLED = 'false'

    const response = await POST(
      new Request('http://localhost:3000/api/v1/dashboard/settings', {
        method: 'POST',
        body: JSON.stringify({ params: { theme: 'dark' }, hostId: 0 }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')
  })
})
