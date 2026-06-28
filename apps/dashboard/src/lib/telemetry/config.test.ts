import { isDoNotTrack, isTelemetryEnabled, parseTelemetryFlag } from './config'
import { describe, expect, test } from 'bun:test'

describe('parseTelemetryFlag', () => {
  test('unset / null / empty → false', () => {
    expect(parseTelemetryFlag(undefined)).toBe(false)
    expect(parseTelemetryFlag(null)).toBe(false)
    expect(parseTelemetryFlag('')).toBe(false)
    expect(parseTelemetryFlag('   ')).toBe(false)
  })

  test('canonical "on" and convenience truthy values → true', () => {
    expect(parseTelemetryFlag('on')).toBe(true)
    expect(parseTelemetryFlag(' ON ')).toBe(true)
    expect(parseTelemetryFlag('true')).toBe(true)
    expect(parseTelemetryFlag('1')).toBe(true)
    expect(parseTelemetryFlag('yes')).toBe(true)
  })

  test('off / false / arbitrary strings → false', () => {
    expect(parseTelemetryFlag('off')).toBe(false)
    expect(parseTelemetryFlag('false')).toBe(false)
    expect(parseTelemetryFlag('0')).toBe(false)
    expect(parseTelemetryFlag('enabled')).toBe(false)
  })
})

describe('isTelemetryEnabled', () => {
  test('ON by default when nothing disables it', () => {
    expect(isTelemetryEnabled({})).toBe(true)
  })

  test('runtime CHM_TELEMETRY=on stays enabled', () => {
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'on' })).toBe(true)
  })

  test('runtime CHM_TELEMETRY=off disables', () => {
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'off' })).toBe(false)
  })

  test('off/0/false/no all disable; unrecognised stays on', () => {
    expect(isTelemetryEnabled({ CHM_TELEMETRY: '0' })).toBe(false)
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'false' })).toBe(false)
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'no' })).toBe(false)
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'whatever' })).toBe(true)
  })

  test('DO_NOT_TRACK hard-overrides an explicit enable', () => {
    expect(
      isTelemetryEnabled({ CHM_TELEMETRY: 'on', DO_NOT_TRACK: '1' })
    ).toBe(false)
    expect(
      isTelemetryEnabled({ CHM_TELEMETRY: 'on', DO_NOT_TRACK: 'true' })
    ).toBe(false)
  })

  test('DO_NOT_TRACK=0 / false does not opt out', () => {
    expect(
      isTelemetryEnabled({ CHM_TELEMETRY: 'on', DO_NOT_TRACK: '0' })
    ).toBe(true)
    expect(
      isTelemetryEnabled({ CHM_TELEMETRY: 'on', DO_NOT_TRACK: 'false' })
    ).toBe(true)
  })
})

describe('isDoNotTrack', () => {
  test('unset → false (no preference)', () => {
    expect(isDoNotTrack(undefined)).toBe(false)
    expect(isDoNotTrack(null)).toBe(false)
    expect(isDoNotTrack('')).toBe(false)
  })

  test('any truthy value → opt out', () => {
    expect(isDoNotTrack('1')).toBe(true)
    expect(isDoNotTrack('true')).toBe(true)
    expect(isDoNotTrack('yes')).toBe(true)
    expect(isDoNotTrack('whatever')).toBe(true)
  })

  test('explicit disabled values → false', () => {
    expect(isDoNotTrack('0')).toBe(false)
    expect(isDoNotTrack('false')).toBe(false)
    expect(isDoNotTrack('no')).toBe(false)
  })
})
