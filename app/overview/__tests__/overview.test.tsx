/**
 * Tests for the overview page charts configuration
 */

import {
  getAllChartIds,
  getChartsForTab,
  getTabConfig,
  HEALTH_TAB_CHARTS,
  OPERATIONS_TAB_CHARTS,
  OVERVIEW_TAB_CHARTS,
  OVERVIEW_TABS,
  type OverviewChartConfig,
  type OverviewTabConfig,
  QUERIES_TAB_CHARTS,
  STORAGE_TAB_CHARTS,
} from '../charts-config'
import { describe, expect, it } from '@jest/globals'

describe('charts-config', () => {
  describe('Configuration Structure', () => {
    it('should have all required tab configurations', () => {
      expect(OVERVIEW_TABS).toHaveLength(5)
      expect(OVERVIEW_TABS.map((t) => t.value)).toEqual([
        'overview',
        'queries',
        'storage',
        'operations',
        'health',
      ])
    })

    it('should have properly structured tab configurations', () => {
      OVERVIEW_TABS.forEach((tab: OverviewTabConfig) => {
        expect(tab).toHaveProperty('value')
        expect(tab).toHaveProperty('label')
        expect(tab).toHaveProperty('gridClassName')
        expect(tab).toHaveProperty('charts')
        expect(Array.isArray(tab.charts)).toBe(true)
      })
    })

    it('should have properly structured chart configurations', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...QUERIES_TAB_CHARTS,
        ...STORAGE_TAB_CHARTS,
        ...OPERATIONS_TAB_CHARTS,
        ...HEALTH_TAB_CHARTS,
      ]

      allCharts.forEach((chart: OverviewChartConfig) => {
        expect(chart).toHaveProperty('id')
        expect(chart).toHaveProperty('component')
        expect(chart).toHaveProperty('className')
        expect(chart).toHaveProperty('type')
        expect(typeof chart.id).toBe('string')
        // Components can be functions or objects (forwardRef)
        expect(['function', 'object']).toContain(typeof chart.component)
      })
    })
  })

  describe('Overview Tab Charts', () => {
    it('should have 9 charts in the overview tab', () => {
      expect(OVERVIEW_TAB_CHARTS).toHaveLength(9)
    })

    it('should have unique chart IDs', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...QUERIES_TAB_CHARTS,
        ...STORAGE_TAB_CHARTS,
        ...OPERATIONS_TAB_CHARTS,
        ...HEALTH_TAB_CHARTS,
      ]
      const ids = allCharts.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should include required overview charts', () => {
      const ids = OVERVIEW_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('query-count-24h')
      expect(ids).toContain('query-count-by-user-24h')
      expect(ids).toContain('query-duration')
      expect(ids).toContain('failed-query-count')
      expect(ids).toContain('memory-usage')
      expect(ids).toContain('cpu-usage')
      expect(ids).toContain('top-table-size')
      expect(ids).toContain('disks-usage-overview')
      expect(ids).toContain('merge-count-overview')
    })

    it('should have proper time intervals configured', () => {
      const queryCountChart = OVERVIEW_TAB_CHARTS.find(
        (c) => c.id === 'query-count-24h'
      )
      expect(queryCountChart?.lastHours).toBe(24)
      expect(queryCountChart?.interval).toBe('toStartOfHour')
    })
  })

  describe('Queries Tab Charts', () => {
    it('should have 5 charts in the queries tab', () => {
      expect(QUERIES_TAB_CHARTS).toHaveLength(5)
    })

    it('should include query performance charts', () => {
      const ids = QUERIES_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('query-count-14d')
      expect(ids).toContain('query-memory')
      expect(ids).toContain('query-cache')
      expect(ids).toContain('query-cache-usage')
      expect(ids).toContain('query-type')
    })
  })

  describe('Storage Tab Charts', () => {
    it('should have 5 charts in the storage tab', () => {
      expect(STORAGE_TAB_CHARTS).toHaveLength(5)
    })

    it('should include storage-related charts', () => {
      const ids = STORAGE_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('disk-size')
      expect(ids).toContain('disks-usage')
      expect(ids).toContain('top-table-size-storage')
      expect(ids).toContain('new-parts-created')
      expect(ids).toContain('backup-size')
    })

    it('should have proper disk usage time range', () => {
      const disksUsageChart = STORAGE_TAB_CHARTS.find(
        (c) => c.id === 'disks-usage'
      )
      expect(disksUsageChart?.lastHours).toBe(24 * 30)
      expect(disksUsageChart?.interval).toBe('toStartOfDay')
    })
  })

  describe('Operations Tab Charts', () => {
    it('should have 6 charts in the operations tab', () => {
      expect(OPERATIONS_TAB_CHARTS).toHaveLength(6)
    })

    it('should include merge and replication charts', () => {
      const ids = OPERATIONS_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('merge-count')
      expect(ids).toContain('merge-avg-duration')
      expect(ids).toContain('replication-queue-count')
      expect(ids).toContain('replication-lag')
      expect(ids).toContain('replication-summary-table')
      expect(ids).toContain('readonly-replica')
    })
  })

  describe('Health Tab Charts', () => {
    it('should have 6 charts in the health tab', () => {
      expect(HEALTH_TAB_CHARTS).toHaveLength(6)
    })

    it('should include error and connection charts', () => {
      const ids = HEALTH_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('failed-queries-health')
      expect(ids).toContain('keeper-exception')
      expect(ids).toContain('zookeeper-wait')
      expect(ids).toContain('zookeeper-requests')
      expect(ids).toContain('connections-http')
      expect(ids).toContain('connections-interserver')
    })
  })

  describe('Utility Functions', () => {
    describe('getTabConfig', () => {
      it('should return the correct tab configuration', () => {
        const overviewTab = getTabConfig('overview')
        expect(overviewTab?.value).toBe('overview')
        expect(overviewTab?.label).toBe('Overview')
      })

      it('should return undefined for non-existent tab', () => {
        const nonExistentTab = getTabConfig('non-existent')
        expect(nonExistentTab).toBeUndefined()
      })

      it('should find all tabs by value', () => {
        OVERVIEW_TABS.forEach((tab) => {
          const found = getTabConfig(tab.value)
          expect(found).toBeDefined()
          expect(found?.value).toBe(tab.value)
        })
      })
    })

    describe('getAllChartIds', () => {
      it('should return all unique chart IDs', () => {
        const allIds = getAllChartIds()
        const uniqueIds = new Set(allIds)
        // Each chart should have a unique ID
        expect(allIds.length).toBe(uniqueIds.size)
      })

      it('should include all chart IDs from all tabs', () => {
        const allIds = getAllChartIds()
        const expectedCount =
          OVERVIEW_TAB_CHARTS.length +
          QUERIES_TAB_CHARTS.length +
          STORAGE_TAB_CHARTS.length +
          OPERATIONS_TAB_CHARTS.length +
          HEALTH_TAB_CHARTS.length
        expect(allIds.length).toBe(expectedCount)
      })

      it('should include specific chart IDs', () => {
        const allIds = getAllChartIds()
        expect(allIds).toContain('query-count-24h')
        expect(allIds).toContain('keeper-exception')
        expect(allIds).toContain('disk-size')
        expect(allIds).toContain('backup-size')
        expect(allIds).toContain('replication-lag')
        expect(allIds).toContain('query-cache-usage')
      })
    })

    describe('getChartsForTab', () => {
      it('should return charts for the overview tab', () => {
        const charts = getChartsForTab('overview')
        expect(charts).toHaveLength(9)
        expect(charts[0].id).toBe('query-count-24h')
      })

      it('should return charts for the queries tab', () => {
        const charts = getChartsForTab('queries')
        expect(charts).toHaveLength(5)
        expect(charts[0].id).toBe('query-count-14d')
      })

      it('should return charts for the storage tab', () => {
        const charts = getChartsForTab('storage')
        expect(charts).toHaveLength(5)
      })

      it('should return charts for the operations tab', () => {
        const charts = getChartsForTab('operations')
        expect(charts).toHaveLength(6)
      })

      it('should return charts for the health tab', () => {
        const charts = getChartsForTab('health')
        expect(charts).toHaveLength(6)
      })

      it('should return empty array for non-existent tab', () => {
        const charts = getChartsForTab('non-existent')
        expect(charts).toEqual([])
      })
    })
  })

  describe('Chart Types', () => {
    it('should categorize charts by type', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...QUERIES_TAB_CHARTS,
        ...STORAGE_TAB_CHARTS,
        ...OPERATIONS_TAB_CHARTS,
        ...HEALTH_TAB_CHARTS,
      ]

      const types = new Set(allCharts.map((c) => c.type))
      expect(types).toContain('area')
      expect(types).toContain('bar')
      expect(types).toContain('metric')
      expect(types).toContain('custom')
      expect(types).toContain('table')
    })

    it('should have type property on all charts', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...QUERIES_TAB_CHARTS,
        ...STORAGE_TAB_CHARTS,
        ...OPERATIONS_TAB_CHARTS,
        ...HEALTH_TAB_CHARTS,
      ]

      allCharts.forEach((chart) => {
        expect(chart.type).toBeDefined()
        expect(['area', 'bar', 'metric', 'custom', 'table']).toContain(
          chart.type
        )
      })
    })
  })

  describe('Grid Layout Classes', () => {
    it('should have proper grid classes for each tab', () => {
      const overviewTab = getTabConfig('overview')
      const healthTab = getTabConfig('health')
      const operationsTab = getTabConfig('operations')

      // Overview uses 3-column layout
      expect(overviewTab?.gridClassName).toContain('grid-cols-1')
      expect(overviewTab?.gridClassName).toContain('md:grid-cols-2')
      expect(overviewTab?.gridClassName).toContain('2xl:grid-cols-3')

      // Health uses 3-column layout
      expect(healthTab?.gridClassName).toContain('grid-cols-1')
      expect(healthTab?.gridClassName).toContain('md:grid-cols-2')

      // Operations uses 2-column layout
      expect(operationsTab?.gridClassName).toContain('grid-cols-1')
      expect(operationsTab?.gridClassName).toContain('md:grid-cols-2')
    })
  })

  describe('Chart Props Validation', () => {
    it('should have className defined for all charts', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...QUERIES_TAB_CHARTS,
        ...STORAGE_TAB_CHARTS,
        ...OPERATIONS_TAB_CHARTS,
        ...HEALTH_TAB_CHARTS,
      ]

      allCharts.forEach((chart) => {
        expect(chart.className).toBeDefined()
        expect(typeof chart.className).toBe('string')
      })
    })

    it('should have optional chartClassName for some charts', () => {
      const backupChart = STORAGE_TAB_CHARTS.find((c) => c.id === 'backup-size')
      expect(backupChart?.chartClassName).toBe('h-full h-[140px] sm:h-[160px]')
    })
  })
})
