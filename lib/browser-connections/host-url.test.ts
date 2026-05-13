import { validateHostUrl } from './host-url'
import { describe, expect, test } from 'bun:test'

describe('validateHostUrl', () => {
  test('accepts public ClickHouse URLs', () => {
    expect(validateHostUrl('https://example.clickhouse.cloud:8443')).toBeNull()
    expect(validateHostUrl('http://8.8.8.8:8123')).toBeNull()
  })

  test('rejects invalid or unsupported URLs', () => {
    expect(validateHostUrl('clickhouse.local')).toContain('Invalid host URL')
    expect(validateHostUrl('file:///tmp/socket')).toContain(
      'Unsupported protocol'
    )
  })

  test('rejects localhost names', () => {
    expect(validateHostUrl('http://localhost:8123')).toContain(
      'internal addresses'
    )
    expect(validateHostUrl('http://db.localhost:8123')).toContain(
      'internal addresses'
    )
  })

  test('rejects internal IPv4 forms after URL normalization', () => {
    for (const host of [
      'http://127.0.0.1:8123',
      'http://127.1:8123',
      'http://0x7f000001:8123',
      'http://2130706433:8123',
      'http://10.0.0.10:8123',
      'http://172.16.0.10:8123',
      'http://192.168.1.10:8123',
      'http://169.254.1.10:8123',
      'http://0.0.0.0:8123',
    ]) {
      expect(validateHostUrl(host)).toContain('internal addresses')
    }
  })

  test('rejects internal IPv6 and IPv4-mapped forms', () => {
    for (const host of [
      'http://[::1]:8123',
      'http://[::]:8123',
      'http://[fc00::1]:8123',
      'http://[fd00::1]:8123',
      'http://[fe80::1]:8123',
      'http://[::ffff:127.0.0.1]:8123',
      'http://[::ffff:192.168.1.1]:8123',
    ]) {
      expect(validateHostUrl(host)).toContain('internal addresses')
    }
  })
})
