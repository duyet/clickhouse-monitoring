import { afterEach, describe, expect, mock, test } from 'bun:test'

// Mock polar-config so we can drive getStateExternal and count calls. Billing is
// "configured" so the function doesn't early-return.
let getStateExternal = mock(async (_args: { externalId: string }) => ({
  activeSubscriptions: [] as Array<{
    productId: string
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  }>,
}))

mock.module('./polar-config', () => ({
  isBillingConfigured: () => true,
  getPolarClient: () => ({ customers: { getStateExternal } }),
  planForProductId: (productId: string) =>
    productId === 'prod_pro'
      ? { planId: 'pro', period: 'monthly' as const }
      : null,
}))

const {
  pullOwnerSubscriptionFromPolar,
  __resetPolarSubscriptionCacheForTests,
} = await import('./polar-subscription')

afterEach(() => {
  __resetPolarSubscriptionCacheForTests()
  getStateExternal.mockClear()
})

describe('pullOwnerSubscriptionFromPolar negative cache', () => {
  test('a 404 (no customer) is cached — second read skips Polar', async () => {
    getStateExternal = mock(async () => {
      throw Object.assign(new Error('not found'), { statusCode: 404 })
    })

    const first = await pullOwnerSubscriptionFromPolar('user_free')
    const second = await pullOwnerSubscriptionFromPolar('user_free')

    expect(first).toBeNull()
    expect(second).toBeNull()
    // Only the first read hit Polar; the second was served from the negative cache.
    expect(getStateExternal).toHaveBeenCalledTimes(1)
  })

  test('a transient error is NOT cached — it retries Polar next read', async () => {
    getStateExternal = mock(async () => {
      throw Object.assign(new Error('upstream'), { statusCode: 503 })
    })

    await pullOwnerSubscriptionFromPolar('user_blip')
    await pullOwnerSubscriptionFromPolar('user_blip')

    // Both reads must reach Polar — caching a blip would strand a real sub.
    expect(getStateExternal).toHaveBeenCalledTimes(2)
  })

  test('a paid user is never negatively cached — every read reaches Polar', async () => {
    getStateExternal = mock(async () => ({
      activeSubscriptions: [
        {
          productId: 'prod_pro',
          status: 'active',
          currentPeriodEnd: '2026-12-31T00:00:00Z',
          cancelAtPeriodEnd: false,
        },
      ],
    }))

    const first = await pullOwnerSubscriptionFromPolar('user_pro')
    const second = await pullOwnerSubscriptionFromPolar('user_pro')

    expect(first?.planId).toBe('pro')
    expect(second?.planId).toBe('pro')
    // A positive result must never short-circuit a later read (no false "free").
    expect(getStateExternal).toHaveBeenCalledTimes(2)
  })
})
