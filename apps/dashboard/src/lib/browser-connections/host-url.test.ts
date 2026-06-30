import { validateHostUrl } from './host-url'
import { describe, expect, test } from 'bun:test'

// Injected DNS resolvers (the 2nd param) so tests never hit the network.
const resolveLoopback = async () => ['127.0.0.1']
const resolvePublic = async () => ['93.184.216.34']

describe('validateHostUrl — private-host SSRF guard', () => {
  test('blocks private / LAN / CGNAT(Tailscale) / loopback by default', async () => {
    // allowPrivate = false (the default everywhere, and forced in cloud).
    expect(
      await validateHostUrl('http://192.168.1.10:8123', resolvePublic, false)
    ).not.toBeNull()
    expect(
      await validateHostUrl('http://10.0.0.5:8123', resolvePublic, false)
    ).not.toBeNull()
    expect(
      // 100.64.0.0/10 is Tailscale's CGNAT range.
      await validateHostUrl('http://100.64.0.1:8123', resolvePublic, false)
    ).not.toBeNull()
    expect(
      await validateHostUrl('http://localhost:8123', resolveLoopback, false)
    ).not.toBeNull()
  })

  test('allows them when allowPrivate = true (self-host opt-in)', async () => {
    expect(
      await validateHostUrl('http://192.168.1.10:8123', resolvePublic, true)
    ).toBeNull()
    expect(
      await validateHostUrl('http://100.64.0.1:8123', resolvePublic, true)
    ).toBeNull()
    // A tailnet hostname that resolves to a loopback/private address.
    expect(
      await validateHostUrl('http://duet-ubuntu:8123', resolveLoopback, true)
    ).toBeNull()
  })

  test('non-http(s) scheme is still rejected even with allowPrivate', async () => {
    expect(
      await validateHostUrl('ftp://192.168.1.10', resolvePublic, true)
    ).not.toBeNull()
  })

  test('a public host is allowed regardless of the flag', async () => {
    expect(
      await validateHostUrl(
        'https://my.clickhouse.cloud:8443',
        resolvePublic,
        false
      )
    ).toBeNull()
  })
})
