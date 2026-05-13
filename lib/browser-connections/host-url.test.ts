import { createHostValidationFetch, validateHostUrl } from './host-url'
import { describe, expect, mock, test } from 'bun:test'

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
      'http://100.64.0.1:8123',
      'http://255.255.255.255:8123',
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
      'http://[2002:0a00:0001::1]:8123',
      'http://[2001:0000:4136:e378:8000:63bf:f5ff:fffe]:8123',
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

  test('fails closed when DNS resolution fails', async () => {
    await expect(
      validateHostUrl('https://timeout.example:8443', async () => {
        throw new Error('DNS lookup timed out')
      })
    ).resolves.toContain('resolve host')
  })

  test('guards each fetch request target', async () => {
    const previousFetch = globalThis.fetch
    const fetchMock = mock(
      async (_input: Parameters<typeof fetch>[0], _init?: RequestInit) =>
        new Response('{}', { status: 200 })
    )
    globalThis.fetch = fetchMock

    try {
      const guardedFetch = createHostValidationFetch(async (hostname) =>
        hostname === 'safe.example' ? ['203.0.113.10'] : ['10.0.0.10']
      )

      const response = await guardedFetch('https://safe.example:8443')
      expect(response.status).toBe(200)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const [calledUrl, calledInit] = fetchMock.mock.calls[0]
      const url =
        calledUrl instanceof Request ? calledUrl.url : calledUrl.toString()
      expect(url).toBe('https://safe.example:8443')
      expect(calledInit).toHaveProperty('dispatcher')

      await expect(
        guardedFetch('https://private.example:8443')
      ).rejects.toThrow('internal addresses')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  test('tries each validated address until fetch connects', async () => {
    const previousFetch = globalThis.fetch
    const fetchMock = mock(
      async (_input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
        if (fetchMock.mock.calls.length === 1) {
          throw new Error('network unreachable')
        }

        return new Response('{}', { status: 200 })
      }
    )
    globalThis.fetch = fetchMock

    try {
      const guardedFetch = createHostValidationFetch(async () => [
        '203.0.113.10',
        '203.0.113.11',
      ])

      const response = await guardedFetch('https://safe.example:8443')

      expect(response.status).toBe(200)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls[0][1]).toHaveProperty('dispatcher')
      expect(fetchMock.mock.calls[1][1]).toHaveProperty('dispatcher')
    } finally {
      globalThis.fetch = previousFetch
    }
  })

  test('does not retry non-idempotent fetch requests', async () => {
    const previousFetch = globalThis.fetch
    const fetchMock = mock(
      async (_input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
        throw new Error('connection reset')
      }
    )
    globalThis.fetch = fetchMock

    try {
      const guardedFetch = createHostValidationFetch(async () => [
        '203.0.113.10',
        '203.0.113.11',
      ])

      await expect(
        guardedFetch('https://safe.example:8443', {
          method: 'POST',
          body: 'SELECT 1',
        })
      ).rejects.toThrow('connection reset')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.fetch = previousFetch
    }
  })
})
