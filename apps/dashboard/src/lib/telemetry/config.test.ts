import {
  isDoNotTrack,
  isTelemetryEnabled,
  isTelemetryFlagDisabled,
} from './config'
import { describe, expect, test } from 'bun:test'

describe('isTelemetryFlagDisabled', () => {
  test('unset / null / unrecognised → not disabled (on)', () => {
    expect(isTelemetryFlagDisabled(undefined)).toBe(false)
    expect(isTelemetryFlagDisabled(null)).toBe(false)
    expect(isTelemetryFlagDisabled('')).toBe(false)
    expect(isTelemetryFlagDisabled('on')).toBe(false)
    expect(isTelemetryFlagDisabled('enabled')).toBe(false)
  })

  test('off / 0 / false / no → disabled', () => {
    expect(isTelemetryFlagDisabled('off')).toBe(true)
    expect(isTelemetryFlagDisabled(' OFF ')).toBe(true)
    expect(isTelemetryFlagDisabled('0')).toBe(true)
    expect(isTelemetryFlagDisabled('false')).toBe(true)
    expect(isTelemetryFlagDisabled('no')).toBe(true)
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
