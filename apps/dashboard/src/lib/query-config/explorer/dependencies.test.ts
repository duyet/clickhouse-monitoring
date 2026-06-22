import { describe, expect, test } from 'bun:test'

import {
  explorerAllDependenciesConfig,
  explorerDatabaseDependenciesConfig,
  explorerDependenciesDownstreamConfig,
  explorerDependenciesUpstreamConfig,
  explorerDictionarySourceConfig,
  explorerTableDependenciesConfig,
} from './dependencies'

// ---------------------------------------------------------------------------
// explorerDatabaseDependenciesConfig
// ---------------------------------------------------------------------------

describe('explorerDatabaseDependenciesConfig', () => {
  test('has the correct name', () => {
    expect(explorerDatabaseDependenciesConfig.name).toBe(
      'explorer-database-dependencies'
    )
  })

  test('has a description', () => {
    expect(typeof explorerDatabaseDependenciesConfig.description).toBe('string')
    expect(
      explorerDatabaseDependenciesConfig.description!.length
    ).toBeGreaterThan(0)
  })

  test('sql is a non-empty string', () => {
    expect(typeof explorerDatabaseDependenciesConfig.sql).toBe('string')
    expect(
      (explorerDatabaseDependenciesConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql references system.tables', () => {
    expect(explorerDatabaseDependenciesConfig.sql as string).toContain(
      'system.tables'
    )
  })

  test('sql uses {database:String} parameter', () => {
    expect(explorerDatabaseDependenciesConfig.sql as string).toContain(
      '{database:String}'
    )
  })

  test('sql filters out .inner_ tables', () => {
    expect(explorerDatabaseDependenciesConfig.sql as string).toContain(
      '.inner_%'
    )
  })

  test('sql filters out temporary tables', () => {
    expect(explorerDatabaseDependenciesConfig.sql as string).toContain(
      'is_temporary = 0'
    )
  })

  test('columns matches expected array', () => {
    expect(explorerDatabaseDependenciesConfig.columns).toEqual([
      'source_database',
      'source_table',
      'source_engine',
      'target_database',
      'target_table',
    ])
  })

  test('defaultParams has database = "default"', () => {
    expect(explorerDatabaseDependenciesConfig.defaultParams).toEqual({
      database: 'default',
    })
  })

  test('sql includes ORDER BY source_table, target_table', () => {
    expect(explorerDatabaseDependenciesConfig.sql as string).toContain(
      'ORDER BY source_table, target_table'
    )
  })

  test('sql includes SELECT DISTINCT', () => {
    expect(explorerDatabaseDependenciesConfig.sql as string).toContain(
      'SELECT DISTINCT'
    )
  })
})

// ---------------------------------------------------------------------------
// explorerDictionarySourceConfig
// ---------------------------------------------------------------------------

describe('explorerDictionarySourceConfig', () => {
  test('has the correct name', () => {
    expect(explorerDictionarySourceConfig.name).toBe(
      'explorer-dictionary-source'
    )
  })

  test('has a description', () => {
    expect(typeof explorerDictionarySourceConfig.description).toBe('string')
    expect(explorerDictionarySourceConfig.description!.length).toBeGreaterThan(
      0
    )
  })

  test('sql is a non-empty string', () => {
    expect(typeof explorerDictionarySourceConfig.sql).toBe('string')
    expect(
      (explorerDictionarySourceConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql references system.dictionaries', () => {
    expect(explorerDictionarySourceConfig.sql as string).toContain(
      'system.dictionaries'
    )
  })

  test('sql uses {database:String} and {table:String} parameters', () => {
    const sql = explorerDictionarySourceConfig.sql as string
    expect(sql).toContain('{database:String}')
    expect(sql).toContain('{table:String}')
  })

  test('columns matches expected array', () => {
    expect(explorerDictionarySourceConfig.columns).toEqual([
      'dict_database',
      'dict_name',
      'source',
      'source_database',
      'source_table',
    ])
  })

  test('defaultParams has database = "default" and empty table', () => {
    expect(explorerDictionarySourceConfig.defaultParams).toEqual({
      database: 'default',
      table: '',
    })
  })

  test('sql extracts source_database via extractAllGroups', () => {
    const sql = explorerDictionarySourceConfig.sql as string
    expect(sql).toContain('extractAllGroups')
    expect(sql).toContain('source_database')
  })

  test('sql extracts source_table via extractAllGroups', () => {
    const sql = explorerDictionarySourceConfig.sql as string
    expect(sql).toContain('source_table')
  })
})

// ---------------------------------------------------------------------------
// explorerDependenciesDownstreamConfig
// ---------------------------------------------------------------------------

describe('explorerDependenciesDownstreamConfig', () => {
  test('has the correct name', () => {
    expect(explorerDependenciesDownstreamConfig.name).toBe(
      'explorer-dependencies-downstream'
    )
  })

  test('has a description mentioning downstream', () => {
    expect(explorerDependenciesDownstreamConfig.description).toContain(
      'downstream'
    )
  })

  test('sql is a non-empty string', () => {
    expect(typeof explorerDependenciesDownstreamConfig.sql).toBe('string')
    expect(
      (explorerDependenciesDownstreamConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql uses has() to check dependencies arrays', () => {
    const sql = explorerDependenciesDownstreamConfig.sql as string
    expect(sql).toContain('has(dependencies_database')
    expect(sql).toContain('has(dependencies_table')
  })

  test('sql uses {database:String} and {table:String} parameters', () => {
    const sql = explorerDependenciesDownstreamConfig.sql as string
    expect(sql).toContain('{database:String}')
    expect(sql).toContain('{table:String}')
  })

  test('columns matches expected array', () => {
    expect(explorerDependenciesDownstreamConfig.columns).toEqual([
      'dependent_database',
      'dependent_table',
      'engine',
      'type',
      'create_table_query',
    ])
  })

  test('defaultParams has database = "default" and empty table', () => {
    expect(explorerDependenciesDownstreamConfig.defaultParams).toEqual({
      database: 'default',
      table: '',
    })
  })

  test('sql computes type field distinguishing MaterializedView/View/Table', () => {
    const sql = explorerDependenciesDownstreamConfig.sql as string
    expect(sql).toContain('MaterializedView')
    expect(sql).toContain("'Materialized View'")
    expect(sql).toContain("'View'")
    expect(sql).toContain("'Table'")
  })

  test('sql includes create_table_query column', () => {
    expect(explorerDependenciesDownstreamConfig.sql as string).toContain(
      'create_table_query'
    )
  })

  test('sql orders by database, name', () => {
    expect(explorerDependenciesDownstreamConfig.sql as string).toContain(
      'ORDER BY database, name'
    )
  })
})

// ---------------------------------------------------------------------------
// explorerDependenciesUpstreamConfig
// ---------------------------------------------------------------------------

describe('explorerDependenciesUpstreamConfig', () => {
  test('has the correct name', () => {
    expect(explorerDependenciesUpstreamConfig.name).toBe(
      'explorer-dependencies-upstream'
    )
  })

  test('has a description mentioning upstream', () => {
    expect(explorerDependenciesUpstreamConfig.description).toContain('upstream')
  })

  test('sql is a non-empty string', () => {
    expect(typeof explorerDependenciesUpstreamConfig.sql).toBe('string')
    expect(
      (explorerDependenciesUpstreamConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql uses arrayJoin on dependencies arrays', () => {
    const sql = explorerDependenciesUpstreamConfig.sql as string
    expect(sql).toContain('arrayJoin(dependencies_database)')
    expect(sql).toContain('arrayJoin(dependencies_table)')
  })

  test('sql uses {database:String} and {table:String} parameters', () => {
    const sql = explorerDependenciesUpstreamConfig.sql as string
    expect(sql).toContain('{database:String}')
    expect(sql).toContain('{table:String}')
  })

  test('sql LEFT JOINs system.tables for engine info', () => {
    const sql = explorerDependenciesUpstreamConfig.sql as string
    expect(sql).toContain('LEFT JOIN system.tables')
  })

  test('columns matches expected array', () => {
    expect(explorerDependenciesUpstreamConfig.columns).toEqual([
      'source_database',
      'source_table',
      'engine',
      'type',
    ])
  })

  test('defaultParams has database = "default" and empty table', () => {
    expect(explorerDependenciesUpstreamConfig.defaultParams).toEqual({
      database: 'default',
      table: '',
    })
  })

  test('sql computes type field distinguishing MaterializedView/View/Table', () => {
    const sql = explorerDependenciesUpstreamConfig.sql as string
    expect(sql).toContain('MaterializedView')
    expect(sql).toContain("'Materialized View'")
    expect(sql).toContain("'View'")
    expect(sql).toContain("'Table'")
  })

  test('sql orders by source_database, source_table', () => {
    expect(explorerDependenciesUpstreamConfig.sql as string).toContain(
      'ORDER BY source_database, source_table'
    )
  })
})

// ---------------------------------------------------------------------------
// explorerAllDependenciesConfig
// ---------------------------------------------------------------------------

describe('explorerAllDependenciesConfig', () => {
  test('has the correct name', () => {
    expect(explorerAllDependenciesConfig.name).toBe('explorer-all-dependencies')
  })

  test('has a description mentioning dictGet and joinGet', () => {
    expect(explorerAllDependenciesConfig.description).toContain('dictGet')
    expect(explorerAllDependenciesConfig.description).toContain('joinGet')
  })

  test('sql is a non-empty string', () => {
    expect(typeof explorerAllDependenciesConfig.sql).toBe('string')
    expect(
      (explorerAllDependenciesConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql uses {database:String} parameter', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      '{database:String}'
    )
  })

  test('sql does NOT use {table:String} (database-level query)', () => {
    expect(explorerAllDependenciesConfig.sql as string).not.toContain(
      '{table:String}'
    )
  })

  test('columns matches expected array', () => {
    expect(explorerAllDependenciesConfig.columns).toEqual([
      'source_database',
      'source_table',
      'source_engine',
      'dependency_type',
      'target_database',
      'target_table',
      'extra_info',
    ])
  })

  test('defaultParams has only database = "default"', () => {
    expect(explorerAllDependenciesConfig.defaultParams).toEqual({
      database: 'default',
    })
  })

  test('sql defines standard_deps CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'standard_deps AS'
    )
  })

  test('sql defines dictget_deps CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'dictget_deps AS'
    )
  })

  test('sql defines joinget_deps CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'joinget_deps AS'
    )
  })

  test('sql defines mv_targets CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'mv_targets AS'
    )
  })

  test('sql defines dict_sources CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'dict_sources AS'
    )
  })

  test('sql defines external_engines CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'external_engines AS'
    )
  })

  test('sql defines standalone_tables CTE', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'standalone_tables AS'
    )
  })

  test('sql UNIONs all 7 CTEs with UNION ALL', () => {
    const sql = explorerAllDependenciesConfig.sql as string
    // count UNION ALL occurrences — 7 CTEs → 6 UNIONs
    const matches = sql.match(/UNION ALL/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(6)
  })

  test('sql includes dictGet pattern in dictget_deps', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain('dictGet')
  })

  test('sql includes joinGet pattern in joinget_deps', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain('joinGet')
  })

  test('sql uses ARRAY JOIN for standard_deps', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain('ARRAY JOIN')
  })

  test('sql includes external engine types', () => {
    const sql = explorerAllDependenciesConfig.sql as string
    expect(sql).toContain("'PostgreSQL'")
    expect(sql).toContain("'MySQL'")
    expect(sql).toContain("'S3'")
    expect(sql).toContain("'Kafka'")
  })

  test('sql orders by source_table, dependency_type, target_table', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain(
      'ORDER BY source_table, dependency_type, target_table'
    )
  })

  test('sql filters out .inner_ tables in standalone_tables', () => {
    expect(explorerAllDependenciesConfig.sql as string).toContain('.inner_%')
  })

  test('dependency_type values in sql: dependency, dictGet, joinGet, mv_target, dict_source, external, empty', () => {
    const sql = explorerAllDependenciesConfig.sql as string
    expect(sql).toContain("'dependency'")
    expect(sql).toContain("'dictGet'")
    expect(sql).toContain("'joinGet'")
    expect(sql).toContain("'mv_target'")
    expect(sql).toContain("'dict_source'")
    expect(sql).toContain("'external'")
  })
})

// ---------------------------------------------------------------------------
// explorerTableDependenciesConfig
// ---------------------------------------------------------------------------

describe('explorerTableDependenciesConfig', () => {
  test('has the correct name', () => {
    expect(explorerTableDependenciesConfig.name).toBe(
      'explorer-table-dependencies'
    )
  })

  test('has a description mentioning dictGet, joinGet, MV targets', () => {
    expect(explorerTableDependenciesConfig.description).toContain('dictGet')
    expect(explorerTableDependenciesConfig.description).toContain('joinGet')
    expect(explorerTableDependenciesConfig.description).toContain('MV targets')
  })

  test('sql is a non-empty string', () => {
    expect(typeof explorerTableDependenciesConfig.sql).toBe('string')
    expect(
      (explorerTableDependenciesConfig.sql as string).trim().length
    ).toBeGreaterThan(0)
  })

  test('sql uses {database:String} and {table:String} parameters', () => {
    const sql = explorerTableDependenciesConfig.sql as string
    expect(sql).toContain('{database:String}')
    expect(sql).toContain('{table:String}')
  })

  test('columns matches expected array', () => {
    expect(explorerTableDependenciesConfig.columns).toEqual([
      'source_database',
      'source_table',
      'source_engine',
      'dependency_type',
      'target_database',
      'target_table',
      'extra_info',
    ])
  })

  test('defaultParams has database = "default" and empty table', () => {
    expect(explorerTableDependenciesConfig.defaultParams).toEqual({
      database: 'default',
      table: '',
    })
  })

  test('sql defines standard_deps_out CTE (outbound standard deps)', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'standard_deps_out AS'
    )
  })

  test('sql defines standard_deps_in CTE (inbound standard deps)', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'standard_deps_in AS'
    )
  })

  test('sql defines dictget_deps_out CTE', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'dictget_deps_out AS'
    )
  })

  test('sql defines dictget_deps_in CTE', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'dictget_deps_in AS'
    )
  })

  test('sql defines joinget_deps_out CTE', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'joinget_deps_out AS'
    )
  })

  test('sql defines mv_targets CTE', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'mv_targets AS'
    )
  })

  test('sql defines mv_targets_in CTE (MVs writing to this table)', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'mv_targets_in AS'
    )
  })

  test('sql defines dict_sources CTE', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'dict_sources AS'
    )
  })

  test('sql defines external_engines CTE', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'external_engines AS'
    )
  })

  test('sql defines current_table CTE (standalone fallback)', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'current_table AS'
    )
  })

  test('sql uses SELECT DISTINCT on all union results', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'SELECT DISTINCT'
    )
  })

  test('sql UNIONs all CTEs (at least 9 UNION ALL)', () => {
    const sql = explorerTableDependenciesConfig.sql as string
    const matches = sql.match(/UNION ALL/g)
    expect(matches).not.toBeNull()
    // 10 CTEs → 9 UNION ALLs
    expect(matches!.length).toBeGreaterThanOrEqual(9)
  })

  test('sql uses has() for inbound standard deps', () => {
    const sql = explorerTableDependenciesConfig.sql as string
    expect(sql).toContain('has(dependencies_database')
    expect(sql).toContain('has(dependencies_table')
  })

  test('sql uses ARRAY JOIN for outbound standard deps', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'ARRAY JOIN'
    )
  })

  test('sql includes system.dictionaries for dict_sources', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'system.dictionaries'
    )
  })

  test('sql orders by source_table, dependency_type, target_table', () => {
    expect(explorerTableDependenciesConfig.sql as string).toContain(
      'ORDER BY source_table, dependency_type, target_table'
    )
  })
})

// ---------------------------------------------------------------------------
// Cross-config structural consistency
// ---------------------------------------------------------------------------

describe('cross-config structural consistency', () => {
  const allConfigs = [
    explorerDatabaseDependenciesConfig,
    explorerDictionarySourceConfig,
    explorerDependenciesDownstreamConfig,
    explorerDependenciesUpstreamConfig,
    explorerAllDependenciesConfig,
    explorerTableDependenciesConfig,
  ]

  test('every config has a unique name', () => {
    const names = allConfigs.map((c) => c.name)
    const unique = new Set(names)
    expect(unique.size).toBe(allConfigs.length)
  })

  test('every name starts with "explorer-"', () => {
    for (const config of allConfigs) {
      expect(config.name).toMatch(/^explorer-/)
    }
  })

  test('every config has a non-empty columns array', () => {
    for (const config of allConfigs) {
      expect(Array.isArray(config.columns)).toBe(true)
      expect((config.columns as string[]).length).toBeGreaterThan(0)
    }
  })

  test('every config has non-empty sql', () => {
    for (const config of allConfigs) {
      const sql = config.sql
      expect(
        typeof sql === 'string' ? sql.trim().length : sql.length
      ).toBeGreaterThan(0)
    }
  })

  test('every config has defaultParams with at least "database"', () => {
    for (const config of allConfigs) {
      expect(config.defaultParams).toBeDefined()
      expect(
        typeof (config.defaultParams as Record<string, unknown>).database
      ).toBe('string')
    }
  })

  const tableConfigs = [
    explorerDictionarySourceConfig,
    explorerDependenciesDownstreamConfig,
    explorerDependenciesUpstreamConfig,
    explorerTableDependenciesConfig,
  ]

  test('table-scoped configs all include defaultParams.table = ""', () => {
    for (const config of tableConfigs) {
      expect((config.defaultParams as Record<string, unknown>).table).toBe('')
    }
  })

  const dbOnlyConfigs = [
    explorerDatabaseDependenciesConfig,
    explorerAllDependenciesConfig,
  ]

  test('database-scoped configs do NOT include defaultParams.table', () => {
    for (const config of dbOnlyConfigs) {
      expect('table' in (config.defaultParams ?? {})).toBe(false)
    }
  })

  test('explorerAllDependenciesConfig and explorerTableDependenciesConfig share same column set', () => {
    expect(explorerAllDependenciesConfig.columns).toEqual(
      explorerTableDependenciesConfig.columns
    )
  })
})
