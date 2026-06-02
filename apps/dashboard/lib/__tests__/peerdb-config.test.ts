import { readNonNegativeIntEnv } from '../peerdb/peerdb-config'

describe('readNonNegativeIntEnv', () => {
  const originalCacheTtl = process.env.PEERDB_CACHE_TTL_MS

  afterEach(() => {
    if (originalCacheTtl === undefined) {
      delete process.env.PEERDB_CACHE_TTL_MS
    } else {
      process.env.PEERDB_CACHE_TTL_MS = originalCacheTtl
    }
  })

  it('returns the fallback when the env var is missing', () => {
    delete process.env.PEERDB_CACHE_TTL_MS

    expect(readNonNegativeIntEnv('PEERDB_CACHE_TTL_MS', 10_000)).toBe(10_000)
  })

  it('returns the fallback for invalid values', () => {
    process.env.PEERDB_CACHE_TTL_MS = 'not-a-number'

    expect(readNonNegativeIntEnv('PEERDB_CACHE_TTL_MS', 10_000)).toBe(10_000)
  })

  it('returns the fallback for negative values', () => {
    process.env.PEERDB_CACHE_TTL_MS = '-5'

    expect(readNonNegativeIntEnv('PEERDB_CACHE_TTL_MS', 10_000)).toBe(10_000)
  })

  it('floors positive numeric values', () => {
    process.env.PEERDB_CACHE_TTL_MS = '2500.9'

    expect(readNonNegativeIntEnv('PEERDB_CACHE_TTL_MS', 10_000)).toBe(2500)
  })
})
