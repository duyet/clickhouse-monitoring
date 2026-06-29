import { filterToDemoHosts, parseDemoHostAllowlist } from './demo-hosts'
import { describe, expect, test } from 'bun:test'

interface Host {
  id: number
  name?: string
  host: string
}

const HOSTS: Host[] = [
  { id: 0, name: 'duet-ubuntu', host: 'https://duet-ubuntu:8443' },
  { id: 1, name: 'duyet-agent', host: 'https://openclaw' },
]

const accessors = {
  name: (h: Host) => h.name,
  host: (h: Host) => h.host,
}

// Cloud mode on for these bindings (CHM_CLOUD_MODE=true wins in isCloudModeServer).
const cloud = (demo?: string): Record<string, string | undefined> => ({
  CHM_CLOUD_MODE: 'true',
  ...(demo !== undefined ? { CHM_CLOUD_DEMO_HOSTS: demo } : {}),
})

describe('parseDemoHostAllowlist', () => {
  test('unset / empty → null (no restriction)', () => {
    expect(parseDemoHostAllowlist({})).toBeNull()
    expect(parseDemoHostAllowlist({ CHM_CLOUD_DEMO_HOSTS: '' })).toBeNull()
    expect(parseDemoHostAllowlist({ CHM_CLOUD_DEMO_HOSTS: '  ' })).toBeNull()
    expect(parseDemoHostAllowlist({ CHM_CLOUD_DEMO_HOSTS: ' , ' })).toBeNull()
  })

  test('parses comma list, lowercased + trimmed', () => {
    const set = parseDemoHostAllowlist({
      CHM_CLOUD_DEMO_HOSTS: ' Duet-Ubuntu , prod ',
    })
    expect(set).toEqual(new Set(['duet-ubuntu', 'prod']))
  })
})

describe('filterToDemoHosts', () => {
  test('cloud + allowlist → only matching hosts, ids preserved', () => {
    const out = filterToDemoHosts(HOSTS, cloud('duet-ubuntu'), accessors)
    expect(out).toEqual([
      { id: 0, name: 'duet-ubuntu', host: 'https://duet-ubuntu:8443' },
    ])
  })

  test('match is case-insensitive', () => {
    const out = filterToDemoHosts(HOSTS, cloud('DUET-UBUNTU'), accessors)
    expect(out.map((h) => h.id)).toEqual([0])
  })

  test('matches by host string too', () => {
    const out = filterToDemoHosts(HOSTS, cloud('https://openclaw'), accessors)
    expect(out.map((h) => h.id)).toEqual([1])
  })

  test('non-cloud → passthrough even with allowlist set', () => {
    const out = filterToDemoHosts(
      HOSTS,
      { CHM_CLOUD_MODE: 'false', CHM_CLOUD_DEMO_HOSTS: 'duet-ubuntu' },
      accessors
    )
    expect(out).toEqual(HOSTS)
  })

  test('cloud + no allowlist → passthrough', () => {
    const out = filterToDemoHosts(HOSTS, cloud(), accessors)
    expect(out).toEqual(HOSTS)
  })

  test('zero-match allowlist → fail-open passthrough (never empty the demo)', () => {
    const out = filterToDemoHosts(HOSTS, cloud('typo-host'), accessors)
    expect(out).toEqual(HOSTS)
  })
})
