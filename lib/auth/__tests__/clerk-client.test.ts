import { describe, expect, test } from 'bun:test'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'

describe('isClerkEnabled', () => {
  test('returns true with clerk provider and pk_ key', () => {
    // Validates .env.local has both NEXT_PUBLIC_AUTH_PROVIDER=clerk
    // and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_* set.
    // Run with: bun --env-file=.env.local test lib/auth/__tests__/clerk-client.test.ts
    // If this fails in CI, the build env vars are misconfigured.
    expect(isClerkEnabled()).toBe(true)
  })
})
