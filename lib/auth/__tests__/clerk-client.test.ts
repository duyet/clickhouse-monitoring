import { describe, expect, test } from 'bun:test'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'

describe('isClerkEnabled', () => {
  test('returns true with clerk provider and pk_ key', () => {
    const originalAuthProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER
    const originalClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    try {
      process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'

      expect(isClerkEnabled()).toBe(true)
    } finally {
      if (originalAuthProvider === undefined) {
        delete process.env.NEXT_PUBLIC_AUTH_PROVIDER
      } else {
        process.env.NEXT_PUBLIC_AUTH_PROVIDER = originalAuthProvider
      }

      if (originalClerkKey === undefined) {
        delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      } else {
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkKey
      }
    }
  })
})
