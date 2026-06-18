/**
 * Snapshot tests for the more/ domain declarative catalog (Plan 02f).
 *
 * For each migrated config, assert that loadDeclarativeConfig(declarativeObj)
 * deep-equals the legacy TS config on its serializable fields.
 *
 * Runtime-only fields excluded from comparison:
 *   rowClassName  — function (row) => string | undefined
 *   expandable    — function-based ExpandableConfig
 *   columnIcons   — React component refs
 *   filterSchema  — contains Icon refs and dynamic option fns
 *
 * docs (table-missing help text) and permission (FeaturePermission as plain
 * data) are now serializable and ARE compared here.
 *
 * Skipped configs (runtime-only fields that the schema cannot express):
 *   page-views — tableCheck + SQL reference runtime EVENTS_TABLE env var
 *   settings   — expandable field (also has permission, but expandable blocks it)
 *   users      — expandable field
 */

import { loadDeclarativeConfig } from '../../loader'
// Declarative catalog objects
import { asynchronousMetricsDeclarative } from './asynchronous-metrics'
import { backupsDeclarative } from './backups'
import { dictionariesDeclarative } from './dictionaries'
import { errorsDeclarative } from './errors'
import { mergeTreeSettingsDeclarative } from './mergetree-settings'
import { metricsDeclarative } from './metrics'
import { rolesDeclarative } from './roles'
import { topUsageColumnsDeclarative } from './top-usage-columns'
import { topUsageTablesDeclarative } from './top-usage-tables'
import { zookeeperDeclarative } from './zookeeper'
import { describe, expect, test } from 'bun:test'
// Legacy TS configs
import { asynchronousMetricsConfig } from '@/lib/query-config/more/asynchronous-metrics'
import { backupsConfig } from '@/lib/query-config/more/backups'
import { dictionariesConfig } from '@/lib/query-config/more/dictionaries'
import { errorsConfig } from '@/lib/query-config/more/errors'
import { mergeTreeSettingsConfig } from '@/lib/query-config/more/mergetree-settings'
import { metricsConfig } from '@/lib/query-config/more/metrics'
import { rolesConfig } from '@/lib/query-config/more/roles'
import { topUsageColumnsConfig } from '@/lib/query-config/more/top-usage-columns'
import { topUsageTablesConfig } from '@/lib/query-config/more/top-usage-tables'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'

// ---------------------------------------------------------------------------
// Helper: compare serializable fields between loaded declarative config and
// legacy TS config. Skips keys absent from the declarative schema.
// ---------------------------------------------------------------------------

const RUNTIME_ONLY_KEYS = new Set([
  'rowClassName',
  'expandable',
  'columnIcons',
  'filterSchema',
  'columnFilters',
  'clickhouseSettings',
  'variants',
])

function compareSerializable(
  loaded: ReturnType<typeof loadDeclarativeConfig>,
  legacy: ReturnType<typeof loadDeclarativeConfig>
): void {
  const legacyRec = legacy as unknown as Record<string, unknown>
  const loadedRec = loaded as unknown as Record<string, unknown>

  for (const key of Object.keys(legacyRec)) {
    if (RUNTIME_ONLY_KEYS.has(key)) continue
    expect(loadedRec[key]).toEqual(legacyRec[key])
  }
}

// ---------------------------------------------------------------------------
// asynchronous-metrics
// ---------------------------------------------------------------------------

describe('asynchronous-metrics declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(asynchronousMetricsDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(asynchronousMetricsDeclarative)
    compareSerializable(loaded, asynchronousMetricsConfig)
  })
})

// ---------------------------------------------------------------------------
// backups
// ---------------------------------------------------------------------------

describe('backups declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(backupsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(backupsDeclarative)
    compareSerializable(loaded, backupsConfig)
  })
})

// ---------------------------------------------------------------------------
// dictionaries
// ---------------------------------------------------------------------------

describe('dictionaries declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(dictionariesDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(dictionariesDeclarative)
    compareSerializable(loaded, dictionariesConfig)
  })
})

// ---------------------------------------------------------------------------
// errors
// ---------------------------------------------------------------------------

describe('errors declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(errorsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(errorsDeclarative)
    compareSerializable(loaded, errorsConfig)
  })
})

// ---------------------------------------------------------------------------
// roles
// ---------------------------------------------------------------------------

describe('roles declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(rolesDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(rolesDeclarative)
    compareSerializable(loaded, rolesConfig)
  })
})

// ---------------------------------------------------------------------------
// top-usage-columns
// ---------------------------------------------------------------------------

describe('top-usage-columns declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(topUsageColumnsDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(topUsageColumnsDeclarative)
    compareSerializable(loaded, topUsageColumnsConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(topUsageColumnsDeclarative)
    const legacySql = topUsageColumnsConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// top-usage-tables
// ---------------------------------------------------------------------------

describe('top-usage-tables declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(topUsageTablesDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(topUsageTablesDeclarative)
    compareSerializable(loaded, topUsageTablesConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(topUsageTablesDeclarative)
    const legacySql = topUsageTablesConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// zookeeper
// ---------------------------------------------------------------------------

describe('zookeeper declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(zookeeperDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(zookeeperDeclarative)
    compareSerializable(loaded, zookeeperConfig)
  })
})

// ---------------------------------------------------------------------------
// mergetree-settings — permission migrated to declarative `permission`
// ---------------------------------------------------------------------------

describe('mergetree-settings declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(mergeTreeSettingsDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(mergeTreeSettingsDeclarative)
    compareSerializable(loaded, mergeTreeSettingsConfig)
  })

  test('permission matches legacy', () => {
    const loaded = loadDeclarativeConfig(mergeTreeSettingsDeclarative)
    expect(loaded.permission).toEqual(mergeTreeSettingsConfig.permission)
  })
})

// ---------------------------------------------------------------------------
// metrics — permission migrated to declarative `permission`
// ---------------------------------------------------------------------------

describe('metrics declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(metricsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(metricsDeclarative)
    compareSerializable(loaded, metricsConfig)
  })

  test('permission matches legacy', () => {
    const loaded = loadDeclarativeConfig(metricsDeclarative)
    expect(loaded.permission).toEqual(metricsConfig.permission)
  })
})
