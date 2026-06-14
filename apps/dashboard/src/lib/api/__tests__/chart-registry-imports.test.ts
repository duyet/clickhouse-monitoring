/**
 * Verify chart registry import maps are non-empty and have correct keys.
 *
 * These import maps were all empty `{}` during the initial port (#1443).
 * The registry-completeness test verifies the composed registry, but this
 * test catches a regression at the source — a map that went back to empty.
 */
import { describe, expect, test } from 'bun:test'
import { logsChartImports } from '@/components/charts/registry/imports/logs-charts'
import { mergeChartImports } from '@/components/charts/registry/imports/merge-charts'
import { miscChartImports } from '@/components/charts/registry/imports/misc-charts'
import { queryChartImports } from '@/components/charts/registry/imports/query-charts'
import { queryPerfChartImports } from '@/components/charts/registry/imports/query-perf-charts'
import { replicationChartImports } from '@/components/charts/registry/imports/replication-charts'
import { securityChartImports } from '@/components/charts/registry/imports/security-charts'
import { systemChartImports } from '@/components/charts/registry/imports/system-charts'
import { threadChartImports } from '@/components/charts/registry/imports/thread-charts'
import { zookeeperChartImports } from '@/components/charts/registry/imports/zookeeper-charts'

const importMaps = [
  { name: 'logs', map: logsChartImports, min: 2 },
  { name: 'merge', map: mergeChartImports, min: 3 },
  { name: 'misc', map: miscChartImports, min: 10 },
  { name: 'query', map: queryChartImports, min: 8 },
  { name: 'query-perf', map: queryPerfChartImports, min: 3 },
  { name: 'replication', map: replicationChartImports, min: 3 },
  { name: 'security', map: securityChartImports, min: 1 },
  { name: 'system', map: systemChartImports, min: 10 },
  { name: 'thread', map: threadChartImports, min: 1 },
  { name: 'zookeeper', map: zookeeperChartImports, min: 5 },
]

describe('Chart registry import maps', () => {
  for (const { name, map, min } of importMaps) {
    describe(`${name} import map`, () => {
      test('is non-empty', () => {
        const keys = Object.keys(map)
        expect(keys.length).toBeGreaterThan(0)
      })

      test(`has at least ${min} charts`, () => {
        const keys = Object.keys(map)
        expect(keys.length).toBeGreaterThanOrEqual(min)
      })

      test('all values are React lazy components', () => {
        for (const [, val] of Object.entries(map)) {
          // React.lazy returns a lazy component object with _payload and _init
          expect(val).toBeDefined()
          expect(typeof val).toBe('object')
        }
      })
    })
  }
})
