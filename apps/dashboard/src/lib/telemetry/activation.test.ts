import { isActivated } from './activation'
import { describe, expect, test } from 'bun:test'

describe('isActivated', () => {
  test('no events → not activated', () => {
    expect(isActivated([])).toBe(false)
  })

  test('connect alone → not activated (need a view)', () => {
    expect(isActivated(['cluster_connected'])).toBe(false)
  })

  test('a view without connect → not activated', () => {
    expect(isActivated(['health_viewed', 'queries_viewed'])).toBe(false)
  })

  test('connect + health view → activated', () => {
    expect(isActivated(['cluster_connected', 'health_viewed'])).toBe(true)
  })

  test('connect + queries view → activated', () => {
    expect(isActivated(['cluster_connected', 'queries_viewed'])).toBe(true)
  })

  test('accepts a Set as well as an array', () => {
    expect(isActivated(new Set(['cluster_connected', 'health_viewed']))).toBe(
      true
    )
  })
})
