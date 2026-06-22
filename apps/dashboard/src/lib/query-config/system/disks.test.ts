import {
  databaseDiskSpaceByDatabaseConfig,
  databaseDiskSpaceConfig,
  diskSpaceConfig,
} from './disks'
import { describe, expect, test } from 'bun:test'
import { ColumnFormat } from '@/types/column-format'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns sql as a single string regardless of whether it is versioned. */
function flatSql(config: { sql: string | { sql: string }[] }): string {
  return typeof config.sql === 'string'
    ? config.sql
    : config.sql.map((v) => v.sql).join('\n')
}

// ---------------------------------------------------------------------------
// diskSpaceConfig
// ---------------------------------------------------------------------------

describe('diskSpaceConfig', () => {
  test('has the correct name', () => {
    expect(diskSpaceConfig.name).toBe('disks')
  })

  test('sql is a non-empty string', () => {
    expect(typeof diskSpaceConfig.sql).toBe('string')
    expect((diskSpaceConfig.sql as string).trim().length).toBeGreaterThan(0)
  })

  test('sql queries system.disks', () => {
    expect(flatSql(diskSpaceConfig)).toContain('system.disks')
  })

  test('sql selects all columns declared in columns array', () => {
    const sql = flatSql(diskSpaceConfig)
    // Each display column must appear in the SQL (either directly or as an alias)
    const expectedInSql = [
      'name',
      'path',
      'readable_used_space',
      'readable_total_space',
      'readable_unreserved_space',
      'readable_free_space',
      'percent_free',
      'keep_free_space',
    ]
    for (const col of expectedInSql) {
      expect(sql).toContain(col)
    }
  })

  test('columns array contains all expected display columns', () => {
    const expected = [
      'name',
      'path',
      'readable_used_space',
      'readable_total_space',
      'readable_unreserved_space',
      'readable_free_space',
      'percent_free',
      'keep_free_space',
    ]
    expect(diskSpaceConfig.columns).toEqual(expected)
  })

  test('defaultView is cards', () => {
    expect(diskSpaceConfig.defaultView).toBe('cards')
  })

  test('card config has primary set to name', () => {
    expect(diskSpaceConfig.card).toBeDefined()
    expect(diskSpaceConfig.card?.primary).toBe('name')
  })

  test('columnFormats applies ColoredBadge to name', () => {
    expect(diskSpaceConfig.columnFormats?.name).toBe(ColumnFormat.ColoredBadge)
  })

  test('relatedCharts references disk-size, disks-usage, disk-usage-trend', () => {
    const names = (diskSpaceConfig.relatedCharts ?? []).map(([name]) => name)
    expect(names).toContain('disk-size')
    expect(names).toContain('disks-usage')
    expect(names).toContain('disk-usage-trend')
  })

  test('relatedCharts has chart options with titles', () => {
    const charts = diskSpaceConfig.relatedCharts ?? []
    for (const [, opts] of charts) {
      expect(typeof (opts as { title?: string }).title).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// databaseDiskSpaceConfig
// ---------------------------------------------------------------------------

describe('databaseDiskSpaceConfig', () => {
  test('has the correct name', () => {
    expect(databaseDiskSpaceConfig.name).toBe('database-disk-usage')
  })

  test('sql is a non-empty string', () => {
    expect(typeof databaseDiskSpaceConfig.sql).toBe('string')
    expect(
      (databaseDiskSpaceConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql queries system.parts', () => {
    expect(flatSql(databaseDiskSpaceConfig)).toContain('system.parts')
  })

  test('columns array is correct', () => {
    expect(databaseDiskSpaceConfig.columns).toEqual([
      'database',
      'readable_used_space',
      'readable_data_compressed',
    ])
  })

  test('sql produces all declared columns', () => {
    const sql = flatSql(databaseDiskSpaceConfig)
    for (const col of databaseDiskSpaceConfig.columns) {
      expect(sql).toContain(col)
    }
  })

  test('database column links to per-database drill-down page', () => {
    const fmt = databaseDiskSpaceConfig.columnFormats?.database
    expect(Array.isArray(fmt)).toBe(true)
    const [format, args] = fmt as [ColumnFormat, { href: string }]
    expect(format).toBe(ColumnFormat.Link)
    expect(args.href).toBe('/disks/database/[database]')
  })

  test('readable_used_space uses BackgroundBar format', () => {
    expect(databaseDiskSpaceConfig.columnFormats?.readable_used_space).toBe(
      ColumnFormat.BackgroundBar
    )
  })

  test('readable_data_compressed uses BackgroundBar format', () => {
    expect(
      databaseDiskSpaceConfig.columnFormats?.readable_data_compressed
    ).toBe(ColumnFormat.BackgroundBar)
  })
})

// ---------------------------------------------------------------------------
// databaseDiskSpaceByDatabaseConfig
// ---------------------------------------------------------------------------

describe('databaseDiskSpaceByDatabaseConfig', () => {
  test('has the correct name', () => {
    expect(databaseDiskSpaceByDatabaseConfig.name).toBe(
      'database-disk-usage-by-database'
    )
  })

  test('sql is a non-empty string', () => {
    expect(typeof databaseDiskSpaceByDatabaseConfig.sql).toBe('string')
    expect(
      (databaseDiskSpaceByDatabaseConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql queries system.parts', () => {
    expect(flatSql(databaseDiskSpaceByDatabaseConfig)).toContain('system.parts')
  })

  test('sql filters by database parameter', () => {
    const sql = flatSql(databaseDiskSpaceByDatabaseConfig)
    expect(sql).toContain('{database:String}')
  })

  test('columns array is correct', () => {
    expect(databaseDiskSpaceByDatabaseConfig.columns).toEqual([
      'table',
      'readable_used_space',
      'readable_data_compressed',
    ])
  })

  test('sql produces all declared columns', () => {
    const sql = flatSql(databaseDiskSpaceByDatabaseConfig)
    for (const col of databaseDiskSpaceByDatabaseConfig.columns) {
      expect(sql).toContain(col)
    }
  })

  test('readable_used_space uses BackgroundBar format', () => {
    expect(
      databaseDiskSpaceByDatabaseConfig.columnFormats?.readable_used_space
    ).toBe(ColumnFormat.BackgroundBar)
  })

  test('readable_data_compressed uses BackgroundBar format', () => {
    expect(
      databaseDiskSpaceByDatabaseConfig.columnFormats?.readable_data_compressed
    ).toBe(ColumnFormat.BackgroundBar)
  })

  test('defaultParams provides a default database value', () => {
    expect(databaseDiskSpaceByDatabaseConfig.defaultParams).toBeDefined()
    expect(databaseDiskSpaceByDatabaseConfig.defaultParams?.database).toBe(
      'default'
    )
  })
})
