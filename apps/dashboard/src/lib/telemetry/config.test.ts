import { isTelemetryEnabled, parseTelemetryFlag } from './config'
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
  test('off by default when nothing enables it', () => {
    expect(isTelemetryEnabled({})).toBe(false)
  })

  test('runtime CHM_TELEMETRY=on enables', () => {
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'on' })).toBe(true)
  })

  test('runtime CHM_TELEMETRY=off stays disabled', () => {
    expect(isTelemetryEnabled({ CHM_TELEMETRY: 'off' })).toBe(false)
  })
})
