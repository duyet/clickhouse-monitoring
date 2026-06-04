import {
  Binary,
  BookOpen,
  Boxes,
  CloudCog,
  Database,
  Eye,
  FileText,
  FolderKanban,
  GitMerge,
  Layers,
  Link,
  MemoryStick,
  Network,
  Rabbit,
  RefreshCw,
  Server,
  TableIcon,
  Timer,
  Trash2,
  Waves,
} from 'lucide-react'

import { describe, expect, test } from 'bun:test'
import {
  getEngineCategory,
  getEngineIcon,
  getEngineIconConfig,
  isIntegrationEngine,
  isReplicatedEngine,
  isSharedEngine,
  isViewEngine,
} from '@/lib/clickhouse-engine-icons'

describe('getEngineIconConfig — MergeTree family', () => {
  test('MergeTree returns mergetree category with TableIcon', () => {
    const cfg = getEngineIconConfig('MergeTree')
    expect(cfg.category).toBe('mergetree')
    expect(cfg.icon).toBe(TableIcon)
    expect(cfg.color).toBeUndefined()
  })

  test('ReplacingMergeTree is mergetree', () => {
    const cfg = getEngineIconConfig('ReplacingMergeTree')
    expect(cfg.category).toBe('mergetree')
    expect(cfg.icon).toBe(TableIcon)
  })

  test('SummingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('SummingMergeTree').category).toBe('mergetree')
  })

  test('AggregatingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('AggregatingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('CollapsingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('CollapsingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('VersionedCollapsingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('VersionedCollapsingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('GraphiteMergeTree is mergetree', () => {
    expect(getEngineIconConfig('GraphiteMergeTree').category).toBe('mergetree')
  })

  test('CoalescingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('CoalescingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('ReplicatedMergeTree is mergetree', () => {
    const cfg = getEngineIconConfig('ReplicatedMergeTree')
    expect(cfg.category).toBe('mergetree')
    expect(cfg.icon).toBe(TableIcon)
    expect(cfg.label).toBe('ReplicatedMergeTree')
  })

  test('ReplicatedReplacingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('ReplicatedReplacingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('ReplicatedAggregatingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('ReplicatedAggregatingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('SharedMergeTree is mergetree', () => {
    const cfg = getEngineIconConfig('SharedMergeTree')
    expect(cfg.category).toBe('mergetree')
    expect(cfg.icon).toBe(TableIcon)
  })

  test('SharedReplacingMergeTree is mergetree', () => {
    expect(getEngineIconConfig('SharedReplacingMergeTree').category).toBe(
      'mergetree'
    )
  })

  test('Replicated prefix on non-MergeTree base is NOT mergetree', () => {
    // e.g. ReplicatedLog does not exist in MERGETREE_VARIANTS
    const cfg = getEngineIconConfig('ReplicatedLog')
    expect(cfg.category).toBe('unknown')
  })

  test('TimeSeries is categorised as mergetree', () => {
    const cfg = getEngineIconConfig('TimeSeries')
    expect(cfg.category).toBe('mergetree')
    expect(cfg.icon).toBe(TableIcon)
    expect(cfg.label).toBe('Time Series')
  })
})

describe('getEngineIconConfig — views', () => {
  test('View returns view category with Eye icon', () => {
    const cfg = getEngineIconConfig('View')
    expect(cfg.category).toBe('view')
    expect(cfg.icon).toBe(Eye)
    expect(cfg.color).toBe('text-gray-500')
  })

  test('MaterializedView returns materialized-view category with Layers icon', () => {
    const cfg = getEngineIconConfig('MaterializedView')
    expect(cfg.category).toBe('materialized-view')
    expect(cfg.icon).toBe(Layers)
    expect(cfg.color).toBe('text-indigo-500')
  })

  test('LiveView returns view category with RefreshCw icon', () => {
    const cfg = getEngineIconConfig('LiveView')
    expect(cfg.category).toBe('view')
    expect(cfg.icon).toBe(RefreshCw)
    expect(cfg.color).toBe('text-green-500')
  })

  test('WindowView returns view category with Timer icon', () => {
    const cfg = getEngineIconConfig('WindowView')
    expect(cfg.category).toBe('view')
    expect(cfg.icon).toBe(Timer)
    expect(cfg.color).toBe('text-amber-500')
  })
})

describe('getEngineIconConfig — dictionary', () => {
  test('Dictionary returns BookOpen with orange color', () => {
    const cfg = getEngineIconConfig('Dictionary')
    expect(cfg.category).toBe('dictionary')
    expect(cfg.icon).toBe(BookOpen)
    expect(cfg.color).toBe('text-orange-500')
  })
})

describe('getEngineIconConfig — database integrations', () => {
  test('PostgreSQL gets sky-600 color', () => {
    const cfg = getEngineIconConfig('PostgreSQL')
    expect(cfg.category).toBe('database-integration')
    expect(cfg.icon).toBe(Database)
    expect(cfg.color).toBe('text-sky-600')
    expect(cfg.label).toBe('PostgreSQL')
  })

  test('MaterializedPostgreSQL also gets PostgreSQL label and sky-600', () => {
    const cfg = getEngineIconConfig('MaterializedPostgreSQL')
    expect(cfg.category).toBe('database-integration')
    expect(cfg.color).toBe('text-sky-600')
    expect(cfg.label).toBe('PostgreSQL')
  })

  test('MySQL gets orange-600', () => {
    const cfg = getEngineIconConfig('MySQL')
    expect(cfg.category).toBe('database-integration')
    expect(cfg.color).toBe('text-orange-600')
    expect(cfg.label).toBe('MySQL')
  })

  test('MongoDB gets green-600', () => {
    const cfg = getEngineIconConfig('MongoDB')
    expect(cfg.category).toBe('database-integration')
    expect(cfg.color).toBe('text-green-600')
    expect(cfg.label).toBe('MongoDB')
  })

  test('other DB engines fall back to slate-500', () => {
    for (const engine of [
      'SQLite',
      'ODBC',
      'JDBC',
      'ExternalDistributed',
      'EmbeddedRocksDB',
    ]) {
      const cfg = getEngineIconConfig(engine)
      expect(cfg.category).toBe('database-integration')
      expect(cfg.icon).toBe(Database)
      expect(cfg.color).toBe('text-slate-500')
      expect(cfg.label).toBe(engine)
    }
  })
})

describe('getEngineIconConfig — queue integrations', () => {
  test('Kafka gets Waves icon with slate-700', () => {
    const cfg = getEngineIconConfig('Kafka')
    expect(cfg.category).toBe('queue-integration')
    expect(cfg.icon).toBe(Waves)
    expect(cfg.color).toBe('text-slate-700')
  })

  test('RabbitMQ gets Rabbit icon with orange-500', () => {
    const cfg = getEngineIconConfig('RabbitMQ')
    expect(cfg.category).toBe('queue-integration')
    expect(cfg.icon).toBe(Rabbit)
    expect(cfg.color).toBe('text-orange-500')
  })

  test('NATS falls back to Waves with cyan-500', () => {
    const cfg = getEngineIconConfig('NATS')
    expect(cfg.category).toBe('queue-integration')
    expect(cfg.icon).toBe(Waves)
    expect(cfg.color).toBe('text-cyan-500')
  })
})

describe('getEngineIconConfig — cloud storage', () => {
  test('S3 returns CloudCog with amber-600 and label S3', () => {
    const cfg = getEngineIconConfig('S3')
    expect(cfg.category).toBe('cloud-storage')
    expect(cfg.icon).toBe(CloudCog)
    expect(cfg.color).toBe('text-amber-600')
    expect(cfg.label).toBe('S3')
  })

  test('S3Queue returns CloudCog with label "S3 Queue"', () => {
    const cfg = getEngineIconConfig('S3Queue')
    expect(cfg.category).toBe('cloud-storage')
    expect(cfg.icon).toBe(CloudCog)
    expect(cfg.label).toBe('S3 Queue')
  })

  test('URL returns Link icon with blue-500', () => {
    const cfg = getEngineIconConfig('URL')
    expect(cfg.category).toBe('cloud-storage')
    expect(cfg.icon).toBe(Link)
    expect(cfg.color).toBe('text-blue-500')
  })

  test('other cloud engines fall back to CloudCog with sky-500', () => {
    for (const engine of ['HDFS', 'AzureBlobStorage', 'GCS']) {
      const cfg = getEngineIconConfig(engine)
      expect(cfg.category).toBe('cloud-storage')
      expect(cfg.icon).toBe(CloudCog)
      expect(cfg.color).toBe('text-sky-500')
    }
  })
})

describe('getEngineIconConfig — data lake', () => {
  test('data lake engines return Waves with teal-500', () => {
    for (const engine of ['Iceberg', 'DeltaLake', 'Hudi', 'Hive']) {
      const cfg = getEngineIconConfig(engine)
      expect(cfg.category).toBe('data-lake')
      expect(cfg.icon).toBe(Waves)
      expect(cfg.color).toBe('text-teal-500')
      expect(cfg.label).toBe(engine)
    }
  })
})

describe('getEngineIconConfig — log engines', () => {
  test('log engines return FileText with gray-500', () => {
    for (const engine of ['TinyLog', 'StripeLog', 'Log']) {
      const cfg = getEngineIconConfig(engine)
      expect(cfg.category).toBe('log')
      expect(cfg.icon).toBe(FileText)
      expect(cfg.color).toBe('text-gray-500')
    }
  })
})

describe('getEngineIconConfig — memory engines', () => {
  test('memory engines return MemoryStick with violet-500', () => {
    for (const engine of ['Memory', 'Set', 'Join']) {
      const cfg = getEngineIconConfig(engine)
      expect(cfg.category).toBe('memory')
      expect(cfg.icon).toBe(MemoryStick)
      expect(cfg.color).toBe('text-violet-500')
    }
  })
})

describe('getEngineIconConfig — special engines', () => {
  test('Buffer is buffer category with FolderKanban and yellow-500', () => {
    const cfg = getEngineIconConfig('Buffer')
    expect(cfg.category).toBe('buffer')
    expect(cfg.icon).toBe(FolderKanban)
    expect(cfg.color).toBe('text-yellow-500')
  })

  test('Distributed is distributed category with Network and blue-600', () => {
    const cfg = getEngineIconConfig('Distributed')
    expect(cfg.category).toBe('distributed')
    expect(cfg.icon).toBe(Network)
    expect(cfg.color).toBe('text-blue-600')
  })

  test('Merge is distributed category with GitMerge and purple-500', () => {
    const cfg = getEngineIconConfig('Merge')
    expect(cfg.category).toBe('distributed')
    expect(cfg.icon).toBe(GitMerge)
    expect(cfg.color).toBe('text-purple-500')
  })

  test('Null is utility with Trash2 and gray-400', () => {
    const cfg = getEngineIconConfig('Null')
    expect(cfg.category).toBe('utility')
    expect(cfg.icon).toBe(Trash2)
    expect(cfg.color).toBe('text-gray-400')
  })

  test('File is utility with FileText and slate-500', () => {
    const cfg = getEngineIconConfig('File')
    expect(cfg.category).toBe('utility')
    expect(cfg.icon).toBe(FileText)
    expect(cfg.color).toBe('text-slate-500')
  })

  test('GenerateRandom is utility with Binary and pink-500', () => {
    const cfg = getEngineIconConfig('GenerateRandom')
    expect(cfg.category).toBe('utility')
    expect(cfg.icon).toBe(Binary)
    expect(cfg.color).toBe('text-pink-500')
    expect(cfg.label).toBe('Random Generator')
  })

  test('Executable is utility with Server and red-500', () => {
    const cfg = getEngineIconConfig('Executable')
    expect(cfg.category).toBe('utility')
    expect(cfg.icon).toBe(Server)
    expect(cfg.color).toBe('text-red-500')
    expect(cfg.label).toBe('Executable')
  })

  test('ExecutablePool shares the same config as Executable', () => {
    const cfg = getEngineIconConfig('ExecutablePool')
    expect(cfg.category).toBe('utility')
    expect(cfg.icon).toBe(Server)
    expect(cfg.color).toBe('text-red-500')
  })

  test('KeeperMap is utility with Boxes and emerald-500', () => {
    const cfg = getEngineIconConfig('KeeperMap')
    expect(cfg.category).toBe('utility')
    expect(cfg.icon).toBe(Boxes)
    expect(cfg.color).toBe('text-emerald-500')
    expect(cfg.label).toBe('Keeper Map')
  })
})

describe('getEngineIconConfig — unknown / fallback', () => {
  test('completely unknown engine returns unknown category with TableIcon', () => {
    const cfg = getEngineIconConfig('SomeNewEngine')
    expect(cfg.category).toBe('unknown')
    expect(cfg.icon).toBe(TableIcon)
    expect(cfg.color).toBeUndefined()
    expect(cfg.label).toBe('SomeNewEngine')
  })

  test('empty string engine label falls back to "Table"', () => {
    const cfg = getEngineIconConfig('')
    expect(cfg.category).toBe('unknown')
    expect(cfg.label).toBe('Table')
  })
})

describe('getEngineIcon', () => {
  test('returns icon directly for MergeTree', () => {
    expect(getEngineIcon('MergeTree')).toBe(TableIcon)
  })

  test('returns icon directly for Kafka', () => {
    expect(getEngineIcon('Kafka')).toBe(Waves)
  })

  test('returns TableIcon for unknown engine', () => {
    expect(getEngineIcon('Bogus')).toBe(TableIcon)
  })
})

describe('getEngineCategory', () => {
  test('returns mergetree for MergeTree', () => {
    expect(getEngineCategory('MergeTree')).toBe('mergetree')
  })

  test('returns unknown for unrecognised engine', () => {
    expect(getEngineCategory('NoSuchEngine')).toBe('unknown')
  })
})

describe('isViewEngine', () => {
  test('returns true for view engines', () => {
    expect(isViewEngine('View')).toBe(true)
    expect(isViewEngine('LiveView')).toBe(true)
    expect(isViewEngine('WindowView')).toBe(true)
  })

  test('returns true for materialized-view', () => {
    expect(isViewEngine('MaterializedView')).toBe(true)
  })

  test('returns false for non-view engines', () => {
    expect(isViewEngine('MergeTree')).toBe(false)
    expect(isViewEngine('Kafka')).toBe(false)
    expect(isViewEngine('Unknown')).toBe(false)
  })
})

describe('isReplicatedEngine', () => {
  test('returns true for Replicated* engines', () => {
    expect(isReplicatedEngine('ReplicatedMergeTree')).toBe(true)
    expect(isReplicatedEngine('ReplicatedAggregatingMergeTree')).toBe(true)
  })

  test('returns false for non-Replicated engines', () => {
    expect(isReplicatedEngine('MergeTree')).toBe(false)
    expect(isReplicatedEngine('SharedMergeTree')).toBe(false)
    expect(isReplicatedEngine('')).toBe(false)
  })
})

describe('isSharedEngine', () => {
  test('returns true for Shared* engines', () => {
    expect(isSharedEngine('SharedMergeTree')).toBe(true)
    expect(isSharedEngine('SharedReplacingMergeTree')).toBe(true)
  })

  test('returns false for non-Shared engines', () => {
    expect(isSharedEngine('MergeTree')).toBe(false)
    expect(isSharedEngine('ReplicatedMergeTree')).toBe(false)
    expect(isSharedEngine('')).toBe(false)
  })
})

describe('isIntegrationEngine', () => {
  test('returns true for database-integration', () => {
    expect(isIntegrationEngine('PostgreSQL')).toBe(true)
    expect(isIntegrationEngine('MySQL')).toBe(true)
  })

  test('returns true for queue-integration', () => {
    expect(isIntegrationEngine('Kafka')).toBe(true)
    expect(isIntegrationEngine('RabbitMQ')).toBe(true)
  })

  test('returns true for cloud-storage', () => {
    expect(isIntegrationEngine('S3')).toBe(true)
    expect(isIntegrationEngine('URL')).toBe(true)
  })

  test('returns true for data-lake', () => {
    expect(isIntegrationEngine('Iceberg')).toBe(true)
    expect(isIntegrationEngine('DeltaLake')).toBe(true)
  })

  test('returns false for non-integration engines', () => {
    expect(isIntegrationEngine('MergeTree')).toBe(false)
    expect(isIntegrationEngine('View')).toBe(false)
    expect(isIntegrationEngine('Null')).toBe(false)
    expect(isIntegrationEngine('Unknown')).toBe(false)
  })
})
