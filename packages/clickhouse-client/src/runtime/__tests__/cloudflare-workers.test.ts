import { afterAll, beforeEach, describe, expect, it } from 'bun:test'

const { isCloudflareWorkers } = await import(
  new URL('../cloudflare-workers.ts?test=cf', import.meta.url).href
)

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
