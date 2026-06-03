import { afterEach, describe, expect, test } from 'bun:test'

/**
 * isClerkEnabled() resolves its inputs from `import.meta.env.VITE_*` (Vite inlines
 * them at build time — the NEXT_PUBLIC_* equivalent). `CLERK_PUBLISHABLE_KEY` is a
 * module-level const captured at import, so each case sets the env vars (bun mirrors
 * process.env into import.meta.env) BEFORE a fresh dynamic import of the module.
 */
const MODULE = '@/lib/clerk/clerk-client'

async function freshIsClerkEnabled(): Promise<boolean> {
  // Cache-bust so the module re-evaluates with the current env.
  const mod = await import(
    `${MODULE}?t=${Date.now()}-${Math.round(performance.now())}`
  )
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
