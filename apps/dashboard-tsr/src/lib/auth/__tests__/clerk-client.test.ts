import { afterEach, describe, expect, test } from 'bun:test'

/**
 * isClerkEnabled() resolves its inputs from `import.meta.env.VITE_*` (Vite inlines
 * them at build time — the NEXT_PUBLIC_* equivalent). `CLERK_PUBLISHABLE_KEY` is a
 * module-level const captured at import, so each case sets the env vars (bun mirrors
 * process.env into import.meta.env) BEFORE a fresh dynamic import of the module.
 */
const MODULE = '@/lib/clerk/clerk-client'

// Monotonic counter for cache-busting. A timestamp (`Date.now()` +
// `performance.now()`) collides when two cases run within the same millisecond
// — the second import then resolves to the FIRST case's cached module (which
// captured the other env), producing an intermittent failure under full-suite
// load. A strictly-incrementing counter guarantees a unique specifier per call.
let importCounter = 0

async function freshIsClerkEnabled(): Promise<boolean> {
  importCounter += 1
  // Cache-bust so the module re-evaluates with the current env.
  const mod = await import(`${MODULE}?t=${importCounter}`)
  return mod.isClerkEnabled()
}

describe('isClerkEnabled', () => {
  const origProvider = process.env.VITE_AUTH_PROVIDER
  const origKey = process.env.VITE_CLERK_PUBLISHABLE_KEY

  afterEach(() => {
    if (origProvider === undefined) delete process.env.VITE_AUTH_PROVIDER
    else process.env.VITE_AUTH_PROVIDER = origProvider
    if (origKey === undefined) delete process.env.VITE_CLERK_PUBLISHABLE_KEY
    else process.env.VITE_CLERK_PUBLISHABLE_KEY = origKey
  })

  test('returns true with clerk provider and pk_ key', async () => {
    process.env.VITE_AUTH_PROVIDER = 'clerk'
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    expect(await freshIsClerkEnabled()).toBe(true)
  })

  test('returns false without a pk_ key', async () => {
    process.env.VITE_AUTH_PROVIDER = 'clerk'
    delete process.env.VITE_CLERK_PUBLISHABLE_KEY
    expect(await freshIsClerkEnabled()).toBe(false)
  })

  test('returns false when provider is not clerk', async () => {
    process.env.VITE_AUTH_PROVIDER = 'none'
    process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    expect(await freshIsClerkEnabled()).toBe(false)
  })
})
