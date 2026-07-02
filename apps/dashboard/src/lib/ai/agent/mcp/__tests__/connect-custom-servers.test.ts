/**
 * Unit tests for the SSRF guard and name sanitiser in connect-custom-servers.
 * Network calls (createMCPClient) are not mocked — only pure functions are tested.
 */

import { isAllowedMcpUrl, sanitizeServerName } from '../connect-custom-servers'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// isAllowedMcpUrl
// ---------------------------------------------------------------------------

// Deterministic DNS stub so tests never touch the network. Maps the domains
// used below to fixed public/private addresses; anything else resolves public.
const PUBLIC_A = '93.184.216.34'
const stubDns = async (host: string): Promise<readonly string[]> => {
  const map: Record<string, string[]> = {
    'mcp.example.com': [PUBLIC_A],
    'api.acme.io': [PUBLIC_A],
    // DNS-rebinding style: public-looking name that points at internal ranges.
    'rebind.internal.test': ['10.0.0.5'],
    'metadata.internal.test': ['169.254.169.254'],
    'v6-private.internal.test': ['fc00::1'],
    'mixed.internal.test': [PUBLIC_A, '192.168.1.10'],
  }
  return map[host] ?? [PUBLIC_A]
}

describe('isAllowedMcpUrl', () => {
  // ---- allowed cases ----

  test('accepts https on a public domain', async () => {
    expect(await isAllowedMcpUrl('https://mcp.example.com/mcp', stubDns)).toBe(
      true
    )
  })

  test('accepts https on a public domain with path and port', async () => {
    expect(
      await isAllowedMcpUrl('https://api.acme.io:8443/mcp/v1', stubDns)
    ).toBe(true)
  })

  test('accepts http on localhost', async () => {
    expect(await isAllowedMcpUrl('http://localhost/mcp', stubDns)).toBe(true)
  })

  test('accepts http on localhost with port', async () => {
    expect(await isAllowedMcpUrl('http://localhost:3001/mcp', stubDns)).toBe(
      true
    )
  })

  test('accepts http on 127.0.0.1', async () => {
    expect(await isAllowedMcpUrl('http://127.0.0.1:8080/mcp', stubDns)).toBe(
      true
    )
  })

  test('accepts http on [::1] (IPv6 loopback)', async () => {
    expect(await isAllowedMcpUrl('http://[::1]:9000/mcp', stubDns)).toBe(true)
  })

  test('accepts https on localhost (https loopback is fine)', async () => {
    expect(await isAllowedMcpUrl('https://localhost/mcp', stubDns)).toBe(true)
  })

  // ---- rejected: protocol ----

  test('rejects non-url string', async () => {
    expect(await isAllowedMcpUrl('not a url', stubDns)).toBe(false)
  })

  test('rejects ftp protocol', async () => {
    expect(await isAllowedMcpUrl('ftp://example.com/mcp', stubDns)).toBe(false)
  })

  test('rejects ws protocol', async () => {
    expect(await isAllowedMcpUrl('ws://example.com/mcp', stubDns)).toBe(false)
  })

  // ---- rejected: http on public hosts ----

  test('rejects http on a public domain', async () => {
    expect(await isAllowedMcpUrl('http://example.com/mcp', stubDns)).toBe(false)
  })

  test('rejects http on an IP that is not loopback', async () => {
    expect(await isAllowedMcpUrl('http://8.8.8.8/mcp', stubDns)).toBe(false)
  })

  // ---- rejected: private IPv4 ranges over https ----

  test('rejects cloud metadata IP 169.254.169.254', async () => {
    expect(
      await isAllowedMcpUrl('https://169.254.169.254/latest/meta-data', stubDns)
    ).toBe(false)
  })

  test('rejects link-local 169.254.x.x', async () => {
    expect(await isAllowedMcpUrl('https://169.254.0.1/mcp', stubDns)).toBe(
      false
    )
  })

  test('rejects private class A 10.x.x.x', async () => {
    expect(await isAllowedMcpUrl('https://10.0.0.1/mcp', stubDns)).toBe(false)
  })

  test('rejects private class B lower bound 172.16.x.x', async () => {
    expect(await isAllowedMcpUrl('https://172.16.0.1/mcp', stubDns)).toBe(false)
  })

  test('rejects private class B upper bound 172.31.x.x', async () => {
    expect(await isAllowedMcpUrl('https://172.31.255.255/mcp', stubDns)).toBe(
      false
    )
  })

  test('allows 172.15.x.x (just outside class B range)', async () => {
    expect(await isAllowedMcpUrl('https://172.15.0.1/mcp', stubDns)).toBe(true)
  })

  test('allows 172.32.x.x (just outside class B range)', async () => {
    expect(await isAllowedMcpUrl('https://172.32.0.1/mcp', stubDns)).toBe(true)
  })

  test('rejects private class C 192.168.x.x', async () => {
    expect(await isAllowedMcpUrl('https://192.168.1.1/mcp', stubDns)).toBe(
      false
    )
  })

  test('rejects loopback 127.x.x.x', async () => {
    expect(await isAllowedMcpUrl('https://127.0.0.2/mcp', stubDns)).toBe(false)
  })

  test('rejects 0.0.0.0', async () => {
    expect(await isAllowedMcpUrl('https://0.0.0.0/mcp', stubDns)).toBe(false)
  })

  // ---- hardening: DNS names resolving to internal addresses ----

  test('rejects a public name that resolves to a private IPv4 (rebind)', async () => {
    expect(
      await isAllowedMcpUrl('https://rebind.internal.test/mcp', stubDns)
    ).toBe(false)
  })

  test('rejects a public name that resolves to the metadata IP', async () => {
    expect(
      await isAllowedMcpUrl('https://metadata.internal.test/mcp', stubDns)
    ).toBe(false)
  })

  test('rejects a public name that resolves to a private IPv6 (ULA)', async () => {
    expect(
      await isAllowedMcpUrl('https://v6-private.internal.test/mcp', stubDns)
    ).toBe(false)
  })

  test('rejects when ANY resolved address is internal', async () => {
    expect(
      await isAllowedMcpUrl('https://mixed.internal.test/mcp', stubDns)
    ).toBe(false)
  })

  // ---- hardening: IPv6 literals (only ::1 allowed) ----

  test('rejects public IPv6 literal', async () => {
    expect(
      await isAllowedMcpUrl('https://[2606:4700:4700::1111]/mcp', stubDns)
    ).toBe(false)
  })

  test('rejects private IPv6 literal (ULA)', async () => {
    expect(await isAllowedMcpUrl('https://[fc00::1]/mcp', stubDns)).toBe(false)
  })

  test('rejects IPv4-mapped IPv6 loopback literal', async () => {
    expect(
      await isAllowedMcpUrl('https://[::ffff:127.0.0.1]/mcp', stubDns)
    ).toBe(false)
  })

  // ---- hardening: numeric-encoded IPv4 ----

  test('rejects decimal-encoded IPv4 (2130706433 = 127.0.0.1)', async () => {
    expect(await isAllowedMcpUrl('https://2130706433/mcp', stubDns)).toBe(false)
  })

  test('rejects hex-encoded IPv4 (0x7f000001)', async () => {
    expect(await isAllowedMcpUrl('https://0x7f000001/mcp', stubDns)).toBe(false)
  })

  test('rejects octal-encoded IPv4 (0177.0.0.1)', async () => {
    expect(await isAllowedMcpUrl('https://0177.0.0.1/mcp', stubDns)).toBe(false)
  })

  test('rejects short-form IPv4 (127.1)', async () => {
    expect(await isAllowedMcpUrl('https://127.1/mcp', stubDns)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// sanitizeServerName
// ---------------------------------------------------------------------------

describe('sanitizeServerName', () => {
  test('lowercases and keeps alphanum', () => {
    expect(sanitizeServerName('MyServer')).toBe('myserver')
  })

  test('replaces spaces with underscores', () => {
    expect(sanitizeServerName('My MCP Server')).toBe('my_mcp_server')
  })

  test('replaces hyphens with underscores', () => {
    expect(sanitizeServerName('my-server')).toBe('my_server')
  })

  test('collapses consecutive non-alphanum into single underscore', () => {
    expect(sanitizeServerName('a -- b')).toBe('a_b')
  })

  test('strips leading and trailing underscores', () => {
    expect(sanitizeServerName('---server---')).toBe('server')
  })

  test('truncates to 20 chars', () => {
    expect(sanitizeServerName('averylongservername123456')).toBe(
      'averylongservername1'
    )
    expect(sanitizeServerName('averylongservername123456').length).toBe(20)
  })

  test('returns "server" for empty or symbols-only input', () => {
    expect(sanitizeServerName('')).toBe('server')
    expect(sanitizeServerName('---')).toBe('server')
  })
})
