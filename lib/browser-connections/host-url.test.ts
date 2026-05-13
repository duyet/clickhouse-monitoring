import { validateHostUrl } from './host-url'
import { describe, expect, test } from 'bun:test'

describe('validateHostUrl', () => {
  test('accepts public ClickHouse URLs', async () => {
    await expect(validateHostUrl('http://8.8.8.8:8123')).resolves.toBeNull()
  })

  test('rejects invalid or unsupported URLs', async () => {
    await expect(validateHostUrl('clickhouse.local')).resolves.toContain(
      'Invalid host URL'
    )
    await expect(validateHostUrl('file:///tmp/socket')).resolves.toContain(
      'Unsupported protocol'
    )
  })

  test('rejects localhost names', async () => {
    await expect(validateHostUrl('http://localhost:8123')).resolves.toContain(
      'internal addresses'
    )
    await expect(
      validateHostUrl('http://db.localhost:8123')
    ).resolves.toContain('internal addresses')
  })

  test('rejects internal IPv4 forms after URL normalization', async () => {
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
      await expect(validateHostUrl(host)).resolves.toContain(
        'internal addresses'
      )
    }
  })

  test('rejects internal IPv6 and IPv4-mapped forms', async () => {
    for (const host of [
      'http://[::1]:8123',
      'http://[::]:8123',
      'http://[fc00::1]:8123',
      'http://[fd00::1]:8123',
      'http://[fe80::1]:8123',
      'http://[::ffff:127.0.0.1]:8123',
      'http://[::ffff:192.168.1.1]:8123',
    ]) {
      await expect(validateHostUrl(host)).resolves.toContain(
        'internal addresses'
      )
    }
  })

  test('checks resolved DNS addresses for internal targets', async () => {
    await expect(
      validateHostUrl('https://public-name.example:8443', async () => [
        '203.0.113.10',
      ])
    ).resolves.toBeNull()

    await expect(
      validateHostUrl('https://private-name.example:8443', async () => [
        '10.0.0.10',
      ])
    ).resolves.toContain('internal addresses')
  })
})
