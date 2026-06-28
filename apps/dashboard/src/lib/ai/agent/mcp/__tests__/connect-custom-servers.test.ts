/**
 * Unit tests for the SSRF guard and name sanitiser in connect-custom-servers.
 * Network calls (createMCPClient) are not mocked — only pure functions are tested.
 */

import { isAllowedMcpUrl, sanitizeServerName } from '../connect-custom-servers'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// isAllowedMcpUrl
// ---------------------------------------------------------------------------

describe('isAllowedMcpUrl', () => {
  // ---- allowed cases ----

  test('accepts https on a public domain', () => {
    expect(isAllowedMcpUrl('https://mcp.example.com/mcp')).toBe(true)
  })

  test('accepts https on a public domain with path and port', () => {
    expect(isAllowedMcpUrl('https://api.acme.io:8443/mcp/v1')).toBe(true)
  })

  test('accepts http on localhost', () => {
    expect(isAllowedMcpUrl('http://localhost/mcp')).toBe(true)
  })

  test('accepts http on localhost with port', () => {
    expect(isAllowedMcpUrl('http://localhost:3001/mcp')).toBe(true)
  })

  test('accepts http on 127.0.0.1', () => {
    expect(isAllowedMcpUrl('http://127.0.0.1:8080/mcp')).toBe(true)
  })

  test('accepts http on [::1] (IPv6 loopback)', () => {
    expect(isAllowedMcpUrl('http://[::1]:9000/mcp')).toBe(true)
  })

  test('accepts https on localhost (https loopback is fine)', () => {
    expect(isAllowedMcpUrl('https://localhost/mcp')).toBe(true)
  })

  // ---- rejected: protocol ----

  test('rejects non-url string', () => {
    expect(isAllowedMcpUrl('not a url')).toBe(false)
  })

  test('rejects ftp protocol', () => {
    expect(isAllowedMcpUrl('ftp://example.com/mcp')).toBe(false)
  })

  test('rejects ws protocol', () => {
    expect(isAllowedMcpUrl('ws://example.com/mcp')).toBe(false)
  })

  // ---- rejected: http on public hosts ----

  test('rejects http on a public domain', () => {
    expect(isAllowedMcpUrl('http://example.com/mcp')).toBe(false)
  })

  test('rejects http on an IP that is not loopback', () => {
    expect(isAllowedMcpUrl('http://8.8.8.8/mcp')).toBe(false)
  })

  // ---- rejected: private IPv4 ranges over https ----

  test('rejects cloud metadata IP 169.254.169.254', () => {
    expect(isAllowedMcpUrl('https://169.254.169.254/latest/meta-data')).toBe(
      false
    )
  })

  test('rejects link-local 169.254.x.x', () => {
    expect(isAllowedMcpUrl('https://169.254.0.1/mcp')).toBe(false)
  })

  test('rejects private class A 10.x.x.x', () => {
    expect(isAllowedMcpUrl('https://10.0.0.1/mcp')).toBe(false)
  })

  test('rejects private class B lower bound 172.16.x.x', () => {
    expect(isAllowedMcpUrl('https://172.16.0.1/mcp')).toBe(false)
  })

  test('rejects private class B upper bound 172.31.x.x', () => {
    expect(isAllowedMcpUrl('https://172.31.255.255/mcp')).toBe(false)
  })

  test('allows 172.15.x.x (just outside class B range)', () => {
    expect(isAllowedMcpUrl('https://172.15.0.1/mcp')).toBe(true)
  })

  test('allows 172.32.x.x (just outside class B range)', () => {
    expect(isAllowedMcpUrl('https://172.32.0.1/mcp')).toBe(true)
  })

  test('rejects private class C 192.168.x.x', () => {
    expect(isAllowedMcpUrl('https://192.168.1.1/mcp')).toBe(false)
  })

  test('rejects loopback 127.x.x.x', () => {
    expect(isAllowedMcpUrl('https://127.0.0.2/mcp')).toBe(false)
  })

  test('rejects 0.0.0.0', () => {
    expect(isAllowedMcpUrl('https://0.0.0.0/mcp')).toBe(false)
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
