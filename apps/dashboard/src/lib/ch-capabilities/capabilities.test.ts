import type { ChClient } from './capabilities'

import { detectChFlavor, parseMajorMinor } from '../telemetry/environment'
import {
  diffCapabilities,
  discoverCapabilities,
  normalizeCapabilities,
} from './capabilities'
import { describe, expect, it } from 'bun:test'

// ---------------------------------------------------------------------------
// normalizeCapabilities
// ---------------------------------------------------------------------------

describe('normalizeCapabilities — tables', () => {
  it('dedupes and sorts table keys, uses database.table when database present', () => {
    const snap = normalizeCapabilities({
      tables: [
        { database: 'system', name: 'query_log' },
        { database: 'system', name: 'asynchronous_metrics' },
        { database: 'system', name: 'query_log' }, // duplicate
      ],
    })
    expect(Object.keys(snap.tables)).toEqual([
      'system.asynchronous_metrics',
      'system.query_log',
    ])
  })

  it('uses bare table key when database is absent or empty', () => {
    const snap = normalizeCapabilities({
      tables: [
        { name: 'metrics' },
        { database: '', name: 'events' },
        { database: null, name: 'errors' },
      ],
    })
    expect(Object.keys(snap.tables)).toEqual(['errors', 'events', 'metrics'])
  })

  it('seeds empty column arrays for tables with no column rows', () => {
    const snap = normalizeCapabilities({
      tables: [{ database: 'system', name: 'tables' }],
    })
    expect(snap.tables['system.tables']).toEqual([])
  })
})

describe('normalizeCapabilities — columns', () => {
  it('dedupes and sorts columns per table', () => {
    const snap = normalizeCapabilities({
      columns: [
        { database: 'system', table: 'query_log', name: 'query_id' },
        { database: 'system', table: 'query_log', name: 'event_time' },
        { database: 'system', table: 'query_log', name: 'query_id' }, // dup
        { database: 'system', table: 'query_log', name: 'type' },
      ],
    })
    expect(snap.tables['system.query_log']).toEqual([
      'event_time',
      'query_id',
      'type',
    ])
  })

  it('merges table rows + column rows correctly', () => {
    const snap = normalizeCapabilities({
      tables: [{ database: 'system', name: 'merges' }],
      columns: [
        { database: 'system', table: 'query_log', name: 'type' },
        { database: 'system', table: 'merges', name: 'database' },
      ],
    })
    // system.merges came from tables + columns, system.query_log only columns
    expect(Object.keys(snap.tables).sort()).toEqual([
      'system.merges',
      'system.query_log',
    ])
    expect(snap.tables['system.merges']).toEqual(['database'])
    expect(snap.tables['system.query_log']).toEqual(['type'])
  })
})

describe('normalizeCapabilities — version / flavor', () => {
  it('sets majorMinor and flavor for a plain OSS version', () => {
    const snap = normalizeCapabilities({ version: '24.8.1.2' })
    expect(snap.version).toBe('24.8.1.2')
    expect(snap.majorMinor).toBe('24.8')
    expect(snap.flavor).toBe('oss')
  })

  it('detects altinity flavor', () => {
    const snap = normalizeCapabilities({ version: '24.8.5.7-altinity' })
    expect(snap.majorMinor).toBe('24.8')
    expect(snap.flavor).toBe('altinity')
  })

  it('returns undefined majorMinor and unknown flavor for empty version', () => {
    const snap = normalizeCapabilities({ version: '' })
    expect(snap.version).toBe('')
    expect(snap.majorMinor).toBeUndefined()
    expect(snap.flavor).toBe('unknown')
  })

  it('treats absent version same as empty', () => {
    const snap = normalizeCapabilities({})
    expect(snap.majorMinor).toBeUndefined()
    expect(snap.flavor).toBe('unknown')
  })
})

describe('normalizeCapabilities — buildFlags', () => {
  it('sorts buildFlags keys alphabetically', () => {
    const snap = normalizeCapabilities({
      buildOptions: [
        { name: 'USE_SSL', value: '1' },
        { name: 'ARCH', value: 'x86_64' },
        { name: 'BUILD_TYPE', value: 'Release' },
      ],
    })
    expect(snap.buildFlags).toEqual({
      ARCH: 'x86_64',
      BUILD_TYPE: 'Release',
      USE_SSL: '1',
    })
    expect(Object.keys(snap.buildFlags!)).toEqual([
      'ARCH',
      'BUILD_TYPE',
      'USE_SSL',
    ])
  })

  it('omits buildFlags when buildOptions is empty', () => {
    const snap = normalizeCapabilities({ buildOptions: [] })
    expect(snap.buildFlags).toBeUndefined()
  })

  it('omits buildFlags when buildOptions is absent', () => {
    const snap = normalizeCapabilities({})
    expect(snap.buildFlags).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// diffCapabilities
// ---------------------------------------------------------------------------

/** Minimal baseline: v23.8 with two tables, one shared with next */
function makeBaseline() {
  return normalizeCapabilities({
    version: '23.8.1.1',
    tables: [
      { database: 'system', name: 'query_log' },
      { database: 'system', name: 'merges' },
    ],
    columns: [
      { database: 'system', table: 'query_log', name: 'type' },
      { database: 'system', table: 'query_log', name: 'event_time' },
      { database: 'system', table: 'merges', name: 'database' },
      { database: 'system', table: 'merges', name: 'elapsed' },
    ],
  })
}

/** Next snapshot: v24.8 — adds a table, removes one, adds/removes columns */
function makeNext() {
  return normalizeCapabilities({
    version: '24.8.1.2',
    tables: [
      { database: 'system', name: 'query_log' },
      // 'merges' dropped in next
      { database: 'system', name: 'error_log' }, // new in next
    ],
    columns: [
      { database: 'system', table: 'query_log', name: 'type' },
      { database: 'system', table: 'query_log', name: 'event_time' },
      { database: 'system', table: 'query_log', name: 'query_duration_ms' }, // added
      // 'error_log' has no column info yet (seeds empty array)
    ],
  })
}

describe('diffCapabilities — added/removed tables', () => {
  it('detects tables added in next', () => {
    const diff = diffCapabilities(makeBaseline(), makeNext())
    expect(diff.addedTables).toEqual(['system.error_log'])
  })

  it('detects tables removed in next', () => {
    const diff = diffCapabilities(makeBaseline(), makeNext())
    expect(diff.removedTables).toEqual(['system.merges'])
  })
})

describe('diffCapabilities — added/removed columns (common tables only)', () => {
  it('detects columns added in a common table', () => {
    const diff = diffCapabilities(makeBaseline(), makeNext())
    expect(diff.addedColumns['system.query_log']).toEqual(['query_duration_ms'])
  })

  it('does NOT list columns for tables only in one snapshot', () => {
    const diff = diffCapabilities(makeBaseline(), makeNext())
    // 'system.merges' only in baseline, 'system.error_log' only in next
    expect(diff.addedColumns['system.merges']).toBeUndefined()
    expect(diff.removedColumns['system.merges']).toBeUndefined()
    expect(diff.addedColumns['system.error_log']).toBeUndefined()
    expect(diff.removedColumns['system.error_log']).toBeUndefined()
  })

  it('detects columns removed from a common table', () => {
    // Build a next where query_log loses event_time
    const next = normalizeCapabilities({
      version: '24.8.1.2',
      columns: [
        { database: 'system', table: 'query_log', name: 'type' },
        // event_time intentionally absent
      ],
    })
    const diff = diffCapabilities(makeBaseline(), next)
    expect(diff.removedColumns['system.query_log']).toEqual(['event_time'])
  })
})

describe('diffCapabilities — versionChanged', () => {
  it('is true when versions differ', () => {
    const diff = diffCapabilities(makeBaseline(), makeNext())
    expect(diff.versionChanged).toBe(true)
  })

  it('is false for identical snapshots', () => {
    const snap = makeBaseline()
    const diff = diffCapabilities(snap, snap)
    expect(diff.versionChanged).toBe(false)
  })
})

describe('diffCapabilities — identical snapshots produce empty diff', () => {
  it('all arrays and records are empty', () => {
    const snap = makeBaseline()
    const diff = diffCapabilities(snap, snap)
    expect(diff.addedTables).toEqual([])
    expect(diff.removedTables).toEqual([])
    expect(diff.addedColumns).toEqual({})
    expect(diff.removedColumns).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Import-contract parity: parseMajorMinor + detectChFlavor
// ---------------------------------------------------------------------------

describe('import contract — parseMajorMinor', () => {
  it('extracts major.minor from 4-part version', () => {
    expect(parseMajorMinor('24.8.1.2')).toBe('24.8')
  })

  it('returns undefined for empty string', () => {
    expect(parseMajorMinor('')).toBeUndefined()
  })

  it('handles altinity suffix correctly', () => {
    expect(parseMajorMinor('24.8.5.7-altinity')).toBe('24.8')
  })
})

describe('import contract — detectChFlavor', () => {
  it('returns oss for plain numeric version', () => {
    expect(detectChFlavor('24.8.1.2')).toBe('oss')
  })

  it('returns altinity for altinity-suffixed version', () => {
    expect(detectChFlavor('24.8.5.7-altinity')).toBe('altinity')
  })

  it('returns unknown for empty string', () => {
    expect(detectChFlavor('')).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// discoverCapabilities (mocked ChClient — exercises the live transform offline)
// ---------------------------------------------------------------------------

/**
 * A fake ChClient that records every query and answers from canned payloads,
 * routed by which system object the query references. Lets us cover the
 * query-result → snapshot transform without a real ClickHouse.
 */
function mockClient(
  responses: {
    version?: unknown
    tables?: unknown
    columns?: unknown
    buildOptions?: unknown
  },
  recorder?: string[]
): ChClient {
  return {
    query: ({ query }) => {
      recorder?.push(query)
      let data: unknown
      if (query.includes('version()')) data = responses.version
      else if (query.includes('system.tables')) data = responses.tables
      else if (query.includes('system.columns')) data = responses.columns
      else if (query.includes('system.build_options'))
        data = responses.buildOptions
      else data = { data: [] }
      return Promise.resolve({ json: () => Promise.resolve(data) })
    },
  }
}

describe('discoverCapabilities', () => {
  it('maps the four query results into a normalized snapshot', async () => {
    const snap = await discoverCapabilities(
      mockClient({
        version: { data: [{ version: '24.8.1.2' }] },
        tables: {
          data: [
            { database: 'system', name: 'query_log' },
            { database: 'system', name: 'metrics' },
          ],
        },
        columns: {
          data: [
            { database: 'system', table: 'query_log', name: 'event_time' },
            { database: 'system', table: 'query_log', name: 'query_id' },
          ],
        },
        buildOptions: {
          data: [{ name: 'BUILD_TYPE', value: 'RelWithDebInfo' }],
        },
      })
    )

    expect(snap.version).toBe('24.8.1.2')
    expect(snap.majorMinor).toBe('24.8')
    expect(snap.flavor).toBe('oss')
    expect(Object.keys(snap.tables)).toEqual([
      'system.metrics',
      'system.query_log',
    ])
    expect(snap.tables['system.query_log']).toEqual(['event_time', 'query_id'])
    expect(snap.buildFlags).toEqual({ BUILD_TYPE: 'RelWithDebInfo' })
  })

  it('falls back to an empty version when version() returns no rows', async () => {
    const snap = await discoverCapabilities(
      mockClient({
        version: { data: [] },
        tables: { data: [] },
        columns: { data: [] },
        buildOptions: { data: [] },
      })
    )

    expect(snap.version).toBe('')
    expect(snap.majorMinor).toBeUndefined()
    expect(snap.flavor).toBe('unknown')
    expect(snap.tables).toEqual({})
    // Empty build options → buildFlags omitted entirely.
    expect(snap.buildFlags).toBeUndefined()
  })

  it('issues exactly the four documented discovery queries', async () => {
    const queries: string[] = []
    await discoverCapabilities(
      mockClient(
        {
          version: { data: [{ version: '24.3.1.1' }] },
          tables: { data: [] },
          columns: { data: [] },
          buildOptions: { data: [] },
        },
        queries
      )
    )

    expect(queries).toHaveLength(4)
    expect(queries.some((q) => q.includes('version()'))).toBe(true)
    expect(
      queries.some((q) => q.includes("system.tables WHERE database = 'system'"))
    ).toBe(true)
    expect(
      queries.some((q) =>
        q.includes("system.columns WHERE database = 'system'")
      )
    ).toBe(true)
    expect(queries.some((q) => q.includes('system.build_options'))).toBe(true)
  })
})
