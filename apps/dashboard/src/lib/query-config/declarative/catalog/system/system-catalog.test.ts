/**
 * Snapshot tests for the system/ domain declarative catalog (Plan 02c).
 *
 * For each migrated config, assert that loadDeclarativeConfig(declarativeObj)
 * deep-equals the legacy TS config on its serializable fields.
 *
 * Runtime-only fields excluded from deep-equal comparison (functions can't be
 * compared by value):
 *   rowClassName  — function (row) => string | undefined
 *   expandable    — function-based ExpandableConfig
 *   columnIcons   — React component refs
 *   permission    — FeaturePermission
 *   filterSchema  — contains Icon refs and dynamic option fns
 *
 * kafka-consumers and part-log migrate their rowClassName via the declarative
 * `rowStyle` rules; rowClassName is excluded from the deep-equal (it's a
 * function) but is verified separately by applying both functions to boundary
 * rows.
 */

import { loadDeclarativeConfig } from '../../loader'
// Declarative catalog objects
import {
  clusterLiveMetricsAllDeclarative,
  clusterLiveMetricsDeclarative,
} from './cluster-live-metrics'
import { clustersDeclarative } from './clusters'
import { clustersTopologyDeclarative } from './clusters-topology'
import {
  databaseTableColumnsDeclarative,
  tablesListDeclarative,
} from './database-table'
import {
  databaseDiskSpaceByDatabaseDeclarative,
  databaseDiskSpaceDeclarative,
  diskSpaceDeclarative,
} from './disks'
import { kafkaConsumersDeclarative } from './kafka-consumers'
import { partLogDeclarative } from './part-log'
import { queryMetricLogDeclarative } from './query-metric-log'
import {
  clustersReplicasStatusDeclarative,
  replicaTablesDeclarative,
} from './replicas-status'
import { replicatedMergeTreeSettingsDeclarative } from './replicated-merge-tree-settings'
import { describe, expect, test } from 'bun:test'
// Legacy TS configs
import {
  clusterLiveMetricsAllConfig,
  clusterLiveMetricsConfig,
} from '@/lib/query-config/system/cluster-live-metrics'
import { clustersConfig } from '@/lib/query-config/system/clusters'
import { clustersTopologyConfig } from '@/lib/query-config/system/clusters-topology'
import {
  databaseTableColumnsConfig,
  tablesListConfig,
} from '@/lib/query-config/system/database-table'
import {
  databaseDiskSpaceByDatabaseConfig,
  databaseDiskSpaceConfig,
  diskSpaceConfig,
} from '@/lib/query-config/system/disks'
import { kafkaConsumersConfig } from '@/lib/query-config/system/kafka-consumers'
import { partLogConfig } from '@/lib/query-config/system/part-log'
import { queryMetricLogConfig } from '@/lib/query-config/system/query-metric-log'
import {
  clustersReplicasStatusConfig,
  replicaTablesConfig,
} from '@/lib/query-config/system/replicas-status'
import { replicatedMergeTreeSettingsConfig } from '@/lib/query-config/system/replicated-merge-tree-settings'

// ---------------------------------------------------------------------------
// Helper: compare serializable fields between loaded declarative config and
// legacy TS config. Skips keys absent from the declarative schema.
// ---------------------------------------------------------------------------

const RUNTIME_ONLY_KEYS = new Set([
  'rowClassName',
  'expandable',
  'columnIcons',
  'permission',
  'filterSchema',
  'columnFilters',
  'clickhouseSettings',
  'variants',
])

function compareSerializable(
  loaded: ReturnType<typeof loadDeclarativeConfig>,
  legacy: ReturnType<typeof loadDeclarativeConfig>
): void {
  // Collect the union of keys from legacy, excluding runtime-only fields.
  const legacyRec = legacy as unknown as Record<string, unknown>
  const loadedRec = loaded as unknown as Record<string, unknown>

  for (const key of Object.keys(legacyRec)) {
    if (RUNTIME_ONLY_KEYS.has(key)) continue
    expect(loadedRec[key]).toEqual(legacyRec[key])
  }
}

// ---------------------------------------------------------------------------
// cluster-live-metrics
// ---------------------------------------------------------------------------

describe('cluster-live-metrics declarative', () => {
  test('clusterLiveMetricsConfig: loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(clusterLiveMetricsDeclarative)
    ).not.toThrow()
  })

  test('clusterLiveMetricsConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(clusterLiveMetricsDeclarative)
    compareSerializable(loaded, clusterLiveMetricsConfig)
  })

  test('clusterLiveMetricsAllConfig: loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(clusterLiveMetricsAllDeclarative)
    ).not.toThrow()
  })

  test('clusterLiveMetricsAllConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(clusterLiveMetricsAllDeclarative)
    compareSerializable(loaded, clusterLiveMetricsAllConfig)
  })
})

// ---------------------------------------------------------------------------
// clusters-topology
// ---------------------------------------------------------------------------

describe('clusters-topology declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(clustersTopologyDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(clustersTopologyDeclarative)
    compareSerializable(loaded, clustersTopologyConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(clustersTopologyDeclarative)
    const legacySql = clustersTopologyConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// clusters
// ---------------------------------------------------------------------------

describe('clusters declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(clustersDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(clustersDeclarative)
    compareSerializable(loaded, clustersConfig)
  })
})

// ---------------------------------------------------------------------------
// database-table: databaseTableColumnsConfig
// ---------------------------------------------------------------------------

describe('database-table columns declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(databaseTableColumnsDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(databaseTableColumnsDeclarative)
    compareSerializable(loaded, databaseTableColumnsConfig)
  })
})

// ---------------------------------------------------------------------------
// database-table: tablesListConfig
// ---------------------------------------------------------------------------

describe('tables-list declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(tablesListDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(tablesListDeclarative)
    compareSerializable(loaded, tablesListConfig)
  })
})

// ---------------------------------------------------------------------------
// disks: diskSpaceConfig
// ---------------------------------------------------------------------------

describe('disks declarative', () => {
  test('diskSpaceConfig: loads without error', () => {
    expect(() => loadDeclarativeConfig(diskSpaceDeclarative)).not.toThrow()
  })

  test('diskSpaceConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(diskSpaceDeclarative)
    compareSerializable(loaded, diskSpaceConfig)
  })

  test('databaseDiskSpaceConfig: loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(databaseDiskSpaceDeclarative)
    ).not.toThrow()
  })

  test('databaseDiskSpaceConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(databaseDiskSpaceDeclarative)
    compareSerializable(loaded, databaseDiskSpaceConfig)
  })

  test('databaseDiskSpaceByDatabaseConfig: loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(databaseDiskSpaceByDatabaseDeclarative)
    ).not.toThrow()
  })

  test('databaseDiskSpaceByDatabaseConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(databaseDiskSpaceByDatabaseDeclarative)
    compareSerializable(loaded, databaseDiskSpaceByDatabaseConfig)
  })
})

// ---------------------------------------------------------------------------
// query-metric-log
// ---------------------------------------------------------------------------

describe('query-metric-log declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(queryMetricLogDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(queryMetricLogDeclarative)
    compareSerializable(loaded, queryMetricLogConfig)
  })
})

// ---------------------------------------------------------------------------
// replicas-status: clustersReplicasStatusConfig
// ---------------------------------------------------------------------------

describe('replicas-status declarative', () => {
  test('clustersReplicasStatusConfig: loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(clustersReplicasStatusDeclarative)
    ).not.toThrow()
  })

  test('clustersReplicasStatusConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(clustersReplicasStatusDeclarative)
    compareSerializable(loaded, clustersReplicasStatusConfig)
  })

  test('replicaTablesConfig: loads without error', () => {
    expect(() => loadDeclarativeConfig(replicaTablesDeclarative)).not.toThrow()
  })

  test('replicaTablesConfig: serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(replicaTablesDeclarative)
    compareSerializable(loaded, replicaTablesConfig)
  })
})

// ---------------------------------------------------------------------------
// replicated-merge-tree-settings
// ---------------------------------------------------------------------------

describe('replicated-merge-tree-settings declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(replicatedMergeTreeSettingsDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(replicatedMergeTreeSettingsDeclarative)
    compareSerializable(loaded, replicatedMergeTreeSettingsConfig)
  })
})

// ---------------------------------------------------------------------------
// kafka-consumers — rowClassName migrated to declarative rowStyle.
// CH 25.12 adds missing_dependencies (amber) before last_exception (red).
// rowClassName is a function (excluded from deep-equal); verify behavioural
// equivalence by applying both the compiled and legacy functions to rows that
// cover every boundary condition.
// ---------------------------------------------------------------------------

describe('kafka-consumers declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(kafkaConsumersDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(kafkaConsumersDeclarative)
    compareSerializable(loaded, kafkaConsumersConfig)
  })

  test('sql is versioned array with 2 entries', () => {
    const loaded = loadDeclarativeConfig(kafkaConsumersDeclarative)
    expect(Array.isArray(loaded.sql)).toBe(true)
    if (Array.isArray(loaded.sql)) {
      expect(loaded.sql.length).toBe(2)
      expect(loaded.sql[0].since).toBe('22.8')
      expect(loaded.sql[1].since).toBe('25.12')
    }
  })

  test('compiled rowClassName matches legacy across boundary rows', () => {
    const loaded = loadDeclarativeConfig(kafkaConsumersDeclarative)
    const compiled = loaded.rowClassName
    const legacy = kafkaConsumersConfig.rowClassName
    expect(typeof compiled).toBe('function')
    expect(typeof legacy).toBe('function')
    if (!compiled || !legacy) return

    const rows: Record<string, unknown>[] = [
      // last_exception boundary (no missing_dependencies)
      { last_exception: '' },
      { last_exception: 'Cannot connect to broker' },
      { last_exception: null },
      { last_exception: undefined },
      {}, // missing keys
      { last_exception: 0 }, // numeric falsy → String(0 || '') === ''
      // missing_dependencies boundary (amber wins over last_exception)
      { missing_dependencies: 'mv_target', last_exception: '' },
      { missing_dependencies: 'mv_target', last_exception: 'some error' },
      { missing_dependencies: '', last_exception: 'some error' }, // amber empty → red
      { missing_dependencies: null }, // null → empty string → no amber
      { missing_dependencies: undefined }, // undefined → empty string → no amber
    ]
    for (const row of rows) {
      expect(compiled(row)).toBe(legacy(row))
    }
  })
})

// ---------------------------------------------------------------------------
// part-log — rowClassName (truthy on error) migrated to declarative rowStyle.
// ---------------------------------------------------------------------------

describe('part-log declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(partLogDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(partLogDeclarative)
    compareSerializable(loaded, partLogConfig)
  })

  test('compiled rowClassName matches legacy across boundary rows', () => {
    const loaded = loadDeclarativeConfig(partLogDeclarative)
    const compiled = loaded.rowClassName
    const legacy = partLogConfig.rowClassName
    expect(typeof compiled).toBe('function')
    expect(typeof legacy).toBe('function')
    if (!compiled || !legacy) return

    const rows: Record<string, unknown>[] = [
      { error: 0 },
      { error: 1 },
      { error: 241 }, // non-zero error code
      { error: null },
      { error: undefined },
      {}, // missing key
    ]
    for (const row of rows) {
      expect(compiled(row)).toBe(legacy(row))
    }
  })
})
