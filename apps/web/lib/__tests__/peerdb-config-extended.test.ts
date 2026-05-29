/**
 * Extended tests for peerdb-config
 * Covers isPeerDBEnabled, getPeerDBConfig, PeerDBError, authHeader, peerdbFetch.
 */

import {
  getPeerDBConfig,
  isPeerDBEnabled,
  PeerDBError,
  peerdbFetch,
  readNonNegativeIntEnv,
} from '../peerdb/peerdb-config'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

// --- readNonNegativeIntEnv (already has a basic test, add more edge cases) ---

describe('readNonNegativeIntEnv', () => {
  it('returns fallback for whitespace-only value', () => {
    process.env.__TEST_INT = '   '
    expect(readNonNegativeIntEnv('__TEST_INT', 42)).toBe(42)
    delete process.env.__TEST_INT
  })

  it('returns fallback for Infinity', () => {
    process.env.__TEST_INT = 'Infinity'
    expect(readNonNegativeIntEnv('__TEST_INT', 42)).toBe(42)
    delete process.env.__TEST_INT
  })

  it('returns fallback for NaN string', () => {
    process.env.__TEST_INT = 'NaN'
    expect(readNonNegativeIntEnv('__TEST_INT', 42)).toBe(42)
    delete process.env.__TEST_INT
  })

  it('returns 0 for zero value', () => {
    process.env.__TEST_INT = '0'
    expect(readNonNegativeIntEnv('__TEST_INT', 42)).toBe(0)
    delete process.env.__TEST_INT
  })

  it('returns floored value for positive decimal', () => {
    process.env.__TEST_INT = '3.7'
    expect(readNonNegativeIntEnv('__TEST_INT', 42)).toBe(3)
    delete process.env.__TEST_INT
  })
})

// --- isPeerDBEnabled ---

describe('isPeerDBEnabled', () => {
  const orig = process.env.PEERDB_API_URL

  afterEach(() => {
    if (orig === undefined) delete process.env.PEERDB_API_URL
    else process.env.PEERDB_API_URL = orig
  })

  it('returns false when PEERDB_API_URL is unset', () => {
    delete process.env.PEERDB_API_URL
    expect(isPeerDBEnabled()).toBe(false)
  })

  it('returns false when PEERDB_API_URL is empty', () => {
    process.env.PEERDB_API_URL = ''
    expect(isPeerDBEnabled()).toBe(false)
  })

  it('returns false when PEERDB_API_URL is whitespace', () => {
    process.env.PEERDB_API_URL = '   '
    expect(isPeerDBEnabled()).toBe(false)
  })

  it('returns true when PEERDB_API_URL is set', () => {
    process.env.PEERDB_API_URL = 'http://localhost:8113'
    expect(isPeerDBEnabled()).toBe(true)
  })
})

// --- getPeerDBConfig ---

describe('getPeerDBConfig', () => {
  const origUrl = process.env.PEERDB_API_URL
  const origPass = process.env.PEERDB_PASSWORD

  afterEach(() => {
    if (origUrl === undefined) delete process.env.PEERDB_API_URL
    else process.env.PEERDB_API_URL = origUrl
    if (origPass === undefined) delete process.env.PEERDB_PASSWORD
    else process.env.PEERDB_PASSWORD = origPass
  })

  it('returns null when not configured', () => {
    delete process.env.PEERDB_API_URL
    expect(getPeerDBConfig()).toBeNull()
  })

  it('returns config without password', () => {
    process.env.PEERDB_API_URL = 'http://localhost:8113/'
    delete process.env.PEERDB_PASSWORD
    const config = getPeerDBConfig()
    expect(config).not.toBeNull()
    expect(config!.baseUrl).toBe('http://localhost:8113')
    expect(config!.password).toBeUndefined()
  })

  it('strips trailing slashes from baseUrl', () => {
    process.env.PEERDB_API_URL = 'http://host:8113///'
    delete process.env.PEERDB_PASSWORD
    expect(getPeerDBConfig()!.baseUrl).toBe('http://host:8113')
  })

  it('returns password when set', () => {
    process.env.PEERDB_API_URL = 'http://localhost:8113'
    process.env.PEERDB_PASSWORD = 'secret123'
    const config = getPeerDBConfig()
    expect(config!.password).toBe('secret123')
  })

  it('trims password whitespace', () => {
    process.env.PEERDB_API_URL = 'http://localhost:8113'
    process.env.PEERDB_PASSWORD = '  secret123  '
    const config = getPeerDBConfig()
    expect(config!.password).toBe('secret123')
  })

  it('omits password when it is whitespace-only', () => {
    process.env.PEERDB_API_URL = 'http://localhost:8113'
    process.env.PEERDB_PASSWORD = '   '
    const config = getPeerDBConfig()
    expect(config!.password).toBeUndefined()
  })
})

// --- PeerDBError ---

describe('PeerDBError', () => {
  it('is an Error with correct name and status', () => {
    const err = new PeerDBError('test message', 503)
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(PeerDBError)
    expect(err.name).toBe('PeerDBError')
    expect(err.message).toBe('test message')
    expect(err.status).toBe(503)
  })
})

// --- peerdbFetch ---

describe('peerdbFetch', () => {
  const origUrl = process.env.PEERDB_API_URL
  const origPass = process.env.PEERDB_PASSWORD

  beforeEach(() => {
    delete process.env.PEERDB_API_URL
    delete process.env.PEERDB_PASSWORD
  })

  afterEach(() => {
    if (origUrl === undefined) delete process.env.PEERDB_API_URL
    else process.env.PEERDB_API_URL = origUrl
    if (origPass === undefined) delete process.env.PEERDB_PASSWORD
    else process.env.PEERDB_PASSWORD = origPass
  })

  it('throws PeerDBError when not configured', async () => {
    try {
      await peerdbFetch('/v1/peers')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(PeerDBError)
      expect((err as PeerDBError).status).toBe(503)
      expect((err as PeerDBError).message).toContain('not configured')
    }
  })

  it('throws PeerDBError 502 on connection failure', async () => {
    process.env.PEERDB_API_URL = 'http://127.0.0.1:1'
    // Short timeout to speed up test
    process.env.PEERDB_FETCH_TIMEOUT_MS = '100'
    try {
      await peerdbFetch('/v1/peers')
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(PeerDBError)
      expect((err as PeerDBError).status).toBe(502)
    } finally {
      delete process.env.PEERDB_FETCH_TIMEOUT_MS
    }
  })
})
