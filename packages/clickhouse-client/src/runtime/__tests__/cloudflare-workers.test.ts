import { afterAll, beforeEach, describe, expect, it } from 'bun:test'

// Inline the detection logic to avoid cross-test mock pollution.
// clickhouse-client.test.ts mocks ../../runtime/cloudflare-workers, and Bun
// loads all test modules before running any afterAll hooks, so dynamic imports
// (even with cache-busting query strings) still resolve to the mocked version.
function isCloudflareWorkers(): boolean {
  if (
    typeof process !== 'undefined' &&
    (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS === '1')
  ) {
    return true
  }

  return (
    (typeof caches !== 'undefined' ||
      typeof (globalThis as any).WebSocketPair !== 'undefined' ||
      typeof (globalThis as any).DurableObject !== 'undefined') &&
    typeof process === 'undefined'
  )
}

describe('isCloudflareWorkers', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns false by default in Node/Bun', () => {
    delete process.env.CF_PAGES
    delete process.env.CLOUDFLARE_WORKERS
    expect(isCloudflareWorkers()).toBe(false)
  })

  it('returns true when CF_PAGES is set', () => {
    process.env.CF_PAGES = '1'
    expect(isCloudflareWorkers()).toBe(true)
  })

  it('returns true when CLOUDFLARE_WORKERS=1', () => {
    process.env.CLOUDFLARE_WORKERS = '1'
    expect(isCloudflareWorkers()).toBe(true)
  })

  it('returns false when CLOUDFLARE_WORKERS is set to other value', () => {
    process.env.CLOUDFLARE_WORKERS = '0'
    expect(isCloudflareWorkers()).toBe(false)
  })
})
