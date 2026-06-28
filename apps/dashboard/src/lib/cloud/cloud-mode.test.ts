import { isCloudModeServer, parseCloudMode } from './cloud-mode'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// parseCloudMode — fail-closed to self-hosted (false) for anything unexpected.
// ---------------------------------------------------------------------------
describe('parseCloudMode', () => {
  test('undefined → false', () => {
    expect(parseCloudMode(undefined)).toBe(false)
  })

  test('null → false', () => {
    expect(parseCloudMode(null)).toBe(false)
  })

  test('empty / whitespace → false', () => {
    expect(parseCloudMode('')).toBe(false)
    expect(parseCloudMode('   ')).toBe(false)
  })

  test('junk → false', () => {
    expect(parseCloudMode('yes')).toBe(false)
    expect(parseCloudMode('on')).toBe(false)
    expect(parseCloudMode('enterprise')).toBe(false)
  })

  test('true / 1 / cloud (case-insensitive, trimmed) → true', () => {
    expect(parseCloudMode('true')).toBe(true)
    expect(parseCloudMode('TRUE')).toBe(true)
    expect(parseCloudMode('  True  ')).toBe(true)
    expect(parseCloudMode('1')).toBe(true)
    expect(parseCloudMode('cloud')).toBe(true)
    expect(parseCloudMode('CLOUD')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isCloudModeServer — runtime CHM_CLOUD_MODE wins over build-time inline.
// ---------------------------------------------------------------------------
describe('isCloudModeServer', () => {
  test('runtime CHM_CLOUD_MODE=true → true', () => {
    expect(isCloudModeServer({ CHM_CLOUD_MODE: 'true' })).toBe(true)
  })

  test('runtime unset → falls back to build-time (false in tests)', () => {
    // VITE_CLOUD_MODE is unset in the test env, so the fallback is false.
    expect(isCloudModeServer({})).toBe(false)
  })

  test('runtime junk → false (does not lock out self-hosted)', () => {
    expect(isCloudModeServer({ CHM_CLOUD_MODE: 'maybe' })).toBe(false)
  })
})
