import { GET } from '../route'
import { afterEach, describe, expect, test } from 'bun:test'

const originalMetricsEnabled = process.env.CHM_FEATURE_METRICS_ENABLED

afterEach(() => {
  if (originalMetricsEnabled === undefined) {
    delete process.env.CHM_FEATURE_METRICS_ENABLED
  } else {
    process.env.CHM_FEATURE_METRICS_ENABLED = originalMetricsEnabled
  }
})

describe('GET /api/v1/menu-counts/[key] feature permissions', () => {
  test('blocks disabled menu count feature before execution', async () => {
    process.env.CHM_FEATURE_METRICS_ENABLED = 'false'

    const response = await GET(
      new Request('http://localhost:3000/api/v1/menu-counts/metrics?hostId=0'),
      { params: Promise.resolve({ key: 'metrics' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')
  })
})
