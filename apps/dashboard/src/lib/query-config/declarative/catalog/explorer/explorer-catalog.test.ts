/**
 * Explorer catalog declarative parity tests — Plan 02e.
 *
 * For each eligible explorer/ config, asserts that loadDeclarativeConfig()
 * applied to its declarative counterpart deep-equals the legacy config on all
 * serializable fields.
 *
 * Runtime-only fields (rowClassName, expandable, columnIcons, permission,
 * filterSchema) are absent from all explorer configs so nothing to exclude.
 *
 * Cast through unknown when indexing a QueryConfig to satisfy TS2352.
 */

import { loadDeclarativeConfig } from '../../loader'
// Declarative counterparts
import { explorerColumnsDeclarative } from './columns'
import { explorerDatabasesDeclarative } from './databases'
import { explorerDdlDeclarative } from './ddl'
import {
  explorerAllDependenciesDeclarative,
  explorerDatabaseDependenciesDeclarative,
  explorerDependenciesDownstreamDeclarative,
  explorerDependenciesUpstreamDeclarative,
  explorerDictionarySourceDeclarative,
  explorerTableDependenciesDeclarative,
} from './dependencies'
import { explorerIndexesDeclarative } from './indexes'
import { explorerProjectionsDeclarative } from './projections'
import { explorerSkipIndexesDeclarative } from './skip-indexes'
import { explorerTablesDeclarative } from './tables'
import { describe, expect, test } from 'bun:test'
// Legacy configs
import { explorerColumnsConfig } from '@/lib/query-config/explorer/columns'
import { explorerDatabasesConfig } from '@/lib/query-config/explorer/databases'
import { explorerDdlConfig } from '@/lib/query-config/explorer/ddl'
import {
  explorerAllDependenciesConfig,
  explorerDatabaseDependenciesConfig,
  explorerDependenciesDownstreamConfig,
  explorerDependenciesUpstreamConfig,
  explorerDictionarySourceConfig,
  explorerTableDependenciesConfig,
} from '@/lib/query-config/explorer/dependencies'
import { explorerIndexesConfig } from '@/lib/query-config/explorer/indexes'
import { explorerProjectionsConfig } from '@/lib/query-config/explorer/projections'
import { explorerSkipIndexesConfig } from '@/lib/query-config/explorer/skip-indexes'
import { explorerTablesConfig } from '@/lib/query-config/explorer/tables'

// ---------------------------------------------------------------------------
// Helper: the serializable fields shared by QueryConfig and DeclarativeQueryConfig
// ---------------------------------------------------------------------------

const SERIALIZABLE_KEYS = [
  'name',
  'description',
  'docs',
  'suggestion',
  'sql',
  'columns',
  'columnFormats',
  'columnDescriptions',
  'columnSizing',
  'tableBehavior',
  'defaultParams',
  'filterParamPresets',
  'optional',
  'tableCheck',
  'disableSqlValidation',
  'refreshInterval',
  'relatedCharts',
  'card',
  'defaultView',
  'bulkActions',
  'bulkActionKey',
  'sortingFns',
] as const

type SerializableKey = (typeof SERIALIZABLE_KEYS)[number]

function pickSerializable(
  cfg: unknown
): Partial<Record<SerializableKey, unknown>> {
  const rec = cfg as unknown as Record<string, unknown>
  const out: Partial<Record<SerializableKey, unknown>> = {}
  for (const key of SERIALIZABLE_KEYS) {
    if (rec[key] !== undefined) {
      out[key] = rec[key]
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Per-config test suites
// ---------------------------------------------------------------------------

describe('explorer-catalog declarative parity', () => {
  const cases: Array<{
    name: string
    legacy: unknown
    declarative: unknown
  }> = [
    {
      name: 'explorer-columns',
      legacy: explorerColumnsConfig,
      declarative: explorerColumnsDeclarative,
    },
    {
      name: 'explorer-databases',
      legacy: explorerDatabasesConfig,
      declarative: explorerDatabasesDeclarative,
    },
    {
      name: 'explorer-ddl',
      legacy: explorerDdlConfig,
      declarative: explorerDdlDeclarative,
    },
    {
      name: 'explorer-database-dependencies',
      legacy: explorerDatabaseDependenciesConfig,
      declarative: explorerDatabaseDependenciesDeclarative,
    },
    {
      name: 'explorer-dictionary-source',
      legacy: explorerDictionarySourceConfig,
      declarative: explorerDictionarySourceDeclarative,
    },
    {
      name: 'explorer-dependencies-downstream',
      legacy: explorerDependenciesDownstreamConfig,
      declarative: explorerDependenciesDownstreamDeclarative,
    },
    {
      name: 'explorer-dependencies-upstream',
      legacy: explorerDependenciesUpstreamConfig,
      declarative: explorerDependenciesUpstreamDeclarative,
    },
    {
      name: 'explorer-all-dependencies',
      legacy: explorerAllDependenciesConfig,
      declarative: explorerAllDependenciesDeclarative,
    },
    {
      name: 'explorer-table-dependencies',
      legacy: explorerTableDependenciesConfig,
      declarative: explorerTableDependenciesDeclarative,
    },
    {
      name: 'explorer-indexes',
      legacy: explorerIndexesConfig,
      declarative: explorerIndexesDeclarative,
    },
    {
      name: 'explorer-projections',
      legacy: explorerProjectionsConfig,
      declarative: explorerProjectionsDeclarative,
    },
    {
      name: 'explorer-skip-indexes',
      legacy: explorerSkipIndexesConfig,
      declarative: explorerSkipIndexesDeclarative,
    },
    {
      name: 'explorer-tables',
      legacy: explorerTablesConfig,
      declarative: explorerTablesDeclarative,
    },
  ]

  for (const { name, legacy, declarative } of cases) {
    describe(name, () => {
      test('loadDeclarativeConfig succeeds', () => {
        const loaded = loadDeclarativeConfig(declarative)
        expect(loaded).toBeDefined()
        expect(typeof loaded).toBe('object')
      })

      test('deep-equals legacy on all serializable fields', () => {
        const loaded = loadDeclarativeConfig(declarative)
        const legacySer = pickSerializable(legacy)

        for (const [key, value] of Object.entries(legacySer)) {
          expect((loaded as unknown as Record<string, unknown>)[key]).toEqual(
            value
          )
        }
      })
    })
  }
})
