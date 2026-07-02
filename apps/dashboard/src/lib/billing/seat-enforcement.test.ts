/**
 * Seat-enforcement unit tests — verifies that the `organizationMembership.created`
 * webhook handler correctly gates new members against the plan seat cap.
 *
 * The webhook fires *after* Clerk creates the row, so `memberships.data.length`
 * (`count`) already includes the new member (post-addition total). The handler
 * passes the pre-addition count (`count - 1`) to `checkSeatLimit`, which uses
 * `used < limit` ("is there room for one more?"). `admit()` below mirrors that
 * exact call so the tests model the real webhook behaviour.
 */

import type { Plan } from './plans'

import { checkSeatLimit } from './entitlements'
import { BILLING_PLANS } from './plans'
import { describe, expect, test } from 'bun:test'

const { free, pro, enterprise } = BILLING_PLANS

// Mirrors the webhook: `count` is the post-addition membership total; admission
// asks whether the pre-addition roster had room for one more.
const admit = (plan: Plan, count: number) => checkSeatLimit(plan, count - 1)

describe('seat-enforcement — webhook admission (post-addition count)', () => {
  test('Free (seats=1): count=1 → allowed (first member fits)', () => {
    expect(admit(free, 1).allowed).toBe(true)
  })

  test('Free (seats=1): count=2 → denied (over the cap — rollback new member)', () => {
    const check = admit(free, 2)
    expect(check.allowed).toBe(false)
    expect(check.limit).toBe(1)
    expect(check.remaining).toBe(0)
    expect(check.reason).toBe('seat_limit')
  })

  test('Pro (seats=3): count=3 → allowed (fills the last seat)', () => {
    expect(admit(pro, 3).allowed).toBe(true)
  })

  test('Pro (seats=3): count=4 → denied (over the cap — rollback new member)', () => {
    expect(admit(pro, 4).allowed).toBe(false)
  })

  test('Enterprise (seats=null): any count → always allowed (unlimited)', () => {
    const check = admit(enterprise, 1_000)
    expect(check.allowed).toBe(true)
    expect(check.unlimited).toBe(true)
    expect(check.limit).toBeNull()
    expect(check.remaining).toBeNull()
  })
})
