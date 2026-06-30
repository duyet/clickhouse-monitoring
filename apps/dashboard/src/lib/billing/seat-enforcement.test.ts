/**
 * Seat-enforcement unit tests — verifies that checkSeatLimit() correctly
 * gates the `organizationMembership.created` webhook handler. The count
 * passed in reflects the post-addition member total (after Clerk fires the
 * webhook, memberships.data.length already includes the new member).
 */

import { checkSeatLimit } from './entitlements'
import { BILLING_PLANS } from './plans'
import { describe, expect, test } from 'bun:test'

const { free, pro, enterprise } = BILLING_PLANS

describe('seat-enforcement — checkSeatLimit', () => {
  test('Free (seats=1): count=0 → allowed (no members yet)', () => {
    expect(checkSeatLimit(free, 0).allowed).toBe(true)
  })

  test('Free (seats=1): count=1 → denied (at the cap — rollback new member)', () => {
    const check = checkSeatLimit(free, 1)
    expect(check.allowed).toBe(false)
    expect(check.limit).toBe(1)
    expect(check.remaining).toBe(0)
    expect(check.reason).toBe('seat_limit')
  })

  test('Pro (seats=3): count=2 → allowed', () => {
    expect(checkSeatLimit(pro, 2).allowed).toBe(true)
  })

  test('Pro (seats=3): count=3 → denied (at the cap)', () => {
    expect(checkSeatLimit(pro, 3).allowed).toBe(false)
  })

  test('Enterprise (seats=null): any count → always allowed (unlimited)', () => {
    const check = checkSeatLimit(enterprise, 1_000)
    expect(check.allowed).toBe(true)
    expect(check.unlimited).toBe(true)
    expect(check.limit).toBeNull()
    expect(check.remaining).toBeNull()
  })
})
