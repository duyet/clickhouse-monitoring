/**
 * Extended tests for clickhouse-engine-icons
 * Covers all engine categories, helper functions, and edge cases.
 */

import {
  getEngineCategory,
  getEngineIcon,
  getEngineIconConfig,
  isIntegrationEngine,
  isReplicatedEngine,
  isSharedEngine,
  isViewEngine,
} from '../clickhouse-engine-icons'
import { describe, expect, it } from 'bun:test'

describe('getEngineIconConfig — MergeTree family', () => {
  it('handles all base MergeTree variants', () => {
    const variants = [
      'MergeTree',
      'ReplacingMergeTree',
      'SummingMergeTree',
      'AggregatingMergeTree',
      'CollapsingMergeTree',
      'VersionedCollapsingMergeTree',
      'GraphiteMergeTree',
      'CoalescingMergeTree',
    ]
    for (const engine of variants) {
      const config = getEngineIconConfig(engine)
      expect(config.category).toBe('mergetree')
      expect(config.label).toBe(engine)
      expect(config.color).toBeUndefined()
    }
  })

  it('handles Replicated* variants', () => {
    const replicated = [
      'ReplicatedMergeTree',
      'ReplicatedReplacingMergeTree',
      'ReplicatedSummingMergeTree',
      'ReplicatedAggregatingMergeTree',
      'ReplicatedCollapsingMergeTree',
      'ReplicatedVersionedCollapsingMergeTree',
      'ReplicatedGraphiteMergeTree',
    ]
    for (const engine of replicated) {
      expect(getEngineIconConfig(engine).category).toBe('mergetree')
    }
  })

  it('handles Shared* variants', () => {
    expect(getEngineIconConfig('SharedMergeTree').category).toBe('mergetree')
    expect(getEngineIconConfig('SharedReplacingMergeTree').category).toBe(
      'mergetree'
    )
  })

  it('TimeSeries maps to mergetree', () => {
    const config = getEngineIconConfig('TimeSeries')
    expect(config.category).toBe('mergetree')
    expect(config.label).toBe('Time Series')
  })
})

describe('getEngineIconConfig — Views', () => {
  it('View', () => {
    const config = getEngineIconConfig('View')
    expect(config.category).toBe('view')
    expect(config.label).toBe('View')
    expect(config.color).toBe('text-gray-500')
  })

  it('MaterializedView', () => {
    const config = getEngineIconConfig('MaterializedView')
    expect(config.category).toBe('materialized-view')
    expect(config.label).toBe('Materialized View')
    expect(config.color).toBe('text-indigo-500')
  })

  it('LiveView', () => {
    const config = getEngineIconConfig('LiveView')
    expect(config.category).toBe('view')
    expect(config.label).toBe('Live View')
    expect(config.color).toBe('text-green-500')
  })

  it('WindowView', () => {
    const config = getEngineIconConfig('WindowView')
    expect(config.category).toBe('view')
    expect(config.label).toBe('Window View')
    expect(config.color).toBe('text-amber-500')
  })
})

describe('getEngineIconConfig — Dictionary', () => {
  it('Dictionary', () => {
    const config = getEngineIconConfig('Dictionary')
    expect(config.category).toBe('dictionary')
    expect(config.label).toBe('Dictionary')
    expect(config.color).toBe('text-orange-500')
  })
})

describe('getEngineIconConfig — Database integrations', () => {
  it('PostgreSQL', () => {
    const config = getEngineIconConfig('PostgreSQL')
    expect(config.category).toBe('database-integration')
    expect(config.label).toBe('PostgreSQL')
    expect(config.color).toBe('text-sky-600')
  })

  it('MaterializedPostgreSQL', () => {
    const config = getEngineIconConfig('MaterializedPostgreSQL')
    expect(config.category).toBe('database-integration')
    expect(config.label).toBe('PostgreSQL')
  })

  it('MySQL', () => {
    const config = getEngineIconConfig('MySQL')
    expect(config.category).toBe('database-integration')
    expect(config.color).toBe('text-orange-600')
  })

  it('MongoDB', () => {
    const config = getEngineIconConfig('MongoDB')
    expect(config.category).toBe('database-integration')
    expect(config.color).toBe('text-green-600')
  })

  it('generic database engine (ODBC)', () => {
    const config = getEngineIconConfig('ODBC')
    expect(config.category).toBe('database-integration')
    expect(config.label).toBe('ODBC')
    expect(config.color).toBe('text-slate-500')
  })

  it('JDBC', () => {
    expect(getEngineIconConfig('JDBC').category).toBe('database-integration')
  })

  it('SQLite', () => {
    expect(getEngineIconConfig('SQLite').category).toBe('database-integration')
  })

  it('ExternalDistributed', () => {
    expect(getEngineIconConfig('ExternalDistributed').category).toBe(
      'database-integration'
    )
  })

  it('EmbeddedRocksDB', () => {
    expect(getEngineIconConfig('EmbeddedRocksDB').category).toBe(
      'database-integration'
    )
  })
})

describe('getEngineIconConfig — Queue integrations', () => {
  it('Kafka', () => {
    const config = getEngineIconConfig('Kafka')
    expect(config.category).toBe('queue-integration')
    expect(config.label).toBe('Kafka')
    expect(config.color).toBe('text-slate-700')
  })

  it('RabbitMQ', () => {
    const config = getEngineIconConfig('RabbitMQ')
    expect(config.category).toBe('queue-integration')
    expect(config.label).toBe('RabbitMQ')
    expect(config.color).toBe('text-orange-500')
  })

  it('NATS (generic queue fallback)', () => {
    const config = getEngineIconConfig('NATS')
    expect(config.category).toBe('queue-integration')
    expect(config.color).toBe('text-cyan-500')
  })
})

describe('getEngineIconConfig — Cloud storage', () => {
  it('S3', () => {
    const config = getEngineIconConfig('S3')
    expect(config.category).toBe('cloud-storage')
    expect(config.label).toBe('S3')
    expect(config.color).toBe('text-amber-600')
  })

  it('S3Queue', () => {
    const config = getEngineIconConfig('S3Queue')
    expect(config.category).toBe('cloud-storage')
    expect(config.label).toBe('S3 Queue')
  })

  it('URL', () => {
    const config = getEngineIconConfig('URL')
    expect(config.category).toBe('cloud-storage')
    expect(config.label).toBe('URL')
    expect(config.color).toBe('text-blue-500')
  })

  it('generic cloud storage (HDFS)', () => {
    const config = getEngineIconConfig('HDFS')
    expect(config.category).toBe('cloud-storage')
    expect(config.color).toBe('text-sky-500')
  })

  it('AzureBlobStorage', () => {
    expect(getEngineIconConfig('AzureBlobStorage').category).toBe(
      'cloud-storage'
    )
  })

  it('GCS', () => {
    expect(getEngineIconConfig('GCS').category).toBe('cloud-storage')
  })
})

describe('getEngineIconConfig — Data lake', () => {
  it('Iceberg', () => {
    const config = getEngineIconConfig('Iceberg')
    expect(config.category).toBe('data-lake')
    expect(config.color).toBe('text-teal-500')
  })

  it('DeltaLake', () => {
    expect(getEngineIconConfig('DeltaLake').category).toBe('data-lake')
  })

  it('Hudi', () => {
    expect(getEngineIconConfig('Hudi').category).toBe('data-lake')
  })

  it('Hive', () => {
    expect(getEngineIconConfig('Hive').category).toBe('data-lake')
  })
})

describe('getEngineIconConfig — Log engines', () => {
  for (const engine of ['TinyLog', 'StripeLog', 'Log']) {
    it(engine, () => {
      const config = getEngineIconConfig(engine)
      expect(config.category).toBe('log')
      expect(config.color).toBe('text-gray-500')
    })
  }
})

describe('getEngineIconConfig — Memory engines', () => {
  for (const engine of ['Memory', 'Set', 'Join']) {
    it(engine, () => {
      const config = getEngineIconConfig(engine)
      expect(config.category).toBe('memory')
      expect(config.color).toBe('text-violet-500')
    })
  }
})

describe('getEngineIconConfig — Buffer', () => {
  it('Buffer', () => {
    const config = getEngineIconConfig('Buffer')
    expect(config.category).toBe('buffer')
    expect(config.label).toBe('Buffer')
    expect(config.color).toBe('text-yellow-500')
  })
})

describe('getEngineIconConfig — Distributed', () => {
  it('Distributed', () => {
    const config = getEngineIconConfig('Distributed')
    expect(config.category).toBe('distributed')
    expect(config.color).toBe('text-blue-600')
  })

  it('Merge', () => {
    const config = getEngineIconConfig('Merge')
    expect(config.category).toBe('distributed')
    expect(config.color).toBe('text-purple-500')
  })
})

describe('getEngineIconConfig — Utility engines', () => {
  it('Null', () => {
    const config = getEngineIconConfig('Null')
    expect(config.category).toBe('utility')
    expect(config.color).toBe('text-gray-400')
  })

  it('File', () => {
    const config = getEngineIconConfig('File')
    expect(config.category).toBe('utility')
    expect(config.color).toBe('text-slate-500')
  })

  it('GenerateRandom', () => {
    const config = getEngineIconConfig('GenerateRandom')
    expect(config.category).toBe('utility')
    expect(config.label).toBe('Random Generator')
    expect(config.color).toBe('text-pink-500')
  })

  it('Executable', () => {
    const config = getEngineIconConfig('Executable')
    expect(config.category).toBe('utility')
    expect(config.color).toBe('text-red-500')
  })

  it('ExecutablePool', () => {
    const config = getEngineIconConfig('ExecutablePool')
    expect(config.category).toBe('utility')
    expect(config.label).toBe('Executable')
  })

  it('KeeperMap', () => {
    const config = getEngineIconConfig('KeeperMap')
    expect(config.category).toBe('utility')
    expect(config.label).toBe('Keeper Map')
    expect(config.color).toBe('text-emerald-500')
  })
})

describe('getEngineIconConfig — Unknown/default', () => {
  it('returns unknown for unrecognized engine', () => {
    const config = getEngineIconConfig('SomeUnknownEngine')
    expect(config.category).toBe('unknown')
    expect(config.label).toBe('SomeUnknownEngine')
    expect(config.color).toBeUndefined()
  })

  it('returns "Table" for empty string', () => {
    const config = getEngineIconConfig('')
    expect(config.category).toBe('unknown')
    expect(config.label).toBe('Table')
  })
})

describe('convenience functions', () => {
  it('getEngineIcon returns the icon component', () => {
    const icon = getEngineIcon('MergeTree')
    expect(icon).toBe(getEngineIconConfig('MergeTree').icon)
  })

  it('getEngineCategory returns the category', () => {
    expect(getEngineCategory('View')).toBe('view')
    expect(getEngineCategory('Kafka')).toBe('queue-integration')
    expect(getEngineCategory('Buffer')).toBe('buffer')
  })

  it('isViewEngine returns true for view and materialized-view', () => {
    expect(isViewEngine('View')).toBe(true)
    expect(isViewEngine('MaterializedView')).toBe(true)
    expect(isViewEngine('LiveView')).toBe(true) // view category
    expect(isViewEngine('MergeTree')).toBe(false)
    expect(isViewEngine('Kafka')).toBe(false)
  })

  it('isReplicatedEngine checks prefix', () => {
    expect(isReplicatedEngine('ReplicatedMergeTree')).toBe(true)
    expect(isReplicatedEngine('ReplicatedReplacingMergeTree')).toBe(true)
    expect(isReplicatedEngine('MergeTree')).toBe(false)
    expect(isReplicatedEngine('SharedMergeTree')).toBe(false)
  })

  it('isSharedEngine checks prefix', () => {
    expect(isSharedEngine('SharedMergeTree')).toBe(true)
    expect(isSharedEngine('SharedReplacingMergeTree')).toBe(true)
    expect(isSharedEngine('MergeTree')).toBe(false)
    expect(isSharedEngine('ReplicatedMergeTree')).toBe(false)
  })

  it('isIntegrationEngine detects all integration categories', () => {
    // database-integration
    expect(isIntegrationEngine('PostgreSQL')).toBe(true)
    expect(isIntegrationEngine('MySQL')).toBe(true)
    // queue-integration
    expect(isIntegrationEngine('Kafka')).toBe(true)
    expect(isIntegrationEngine('RabbitMQ')).toBe(true)
    // cloud-storage
    expect(isIntegrationEngine('S3')).toBe(true)
    expect(isIntegrationEngine('HDFS')).toBe(true)
    // data-lake
    expect(isIntegrationEngine('Iceberg')).toBe(true)
    expect(isIntegrationEngine('DeltaLake')).toBe(true)
    // non-integrations
    expect(isIntegrationEngine('MergeTree')).toBe(false)
    expect(isIntegrationEngine('View')).toBe(false)
    expect(isIntegrationEngine('Memory')).toBe(false)
  })
})
