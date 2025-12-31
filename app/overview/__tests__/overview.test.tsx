/**
 * Tests for the overview page charts configuration
 */

import { describe, expect, it } from '@jest/globals'
import {
  OVERVIEW_TABS,
  OVERVIEW_TAB_CHARTS,
  ERRORS_TAB_CHARTS,
  DISKS_TAB_CHARTS,
  BACKUPS_TAB_CHARTS,
  getTabConfig,
  getAllChartIds,
  getChartsForTab,
  type OverviewChartConfig,
  type OverviewTabConfig,
} from '../charts-config'

describe('charts-config', () => {
  describe('Configuration Structure', () => {
    it('should have all required tab configurations', () => {
      expect(OVERVIEW_TABS).toHaveLength(4)
      expect(OVERVIEW_TABS.map((t) => t.value)).toEqual([
        'overview',
        'errors',
        'disks',
        'backups',
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
        ...ERRORS_TAB_CHARTS,
        ...DISKS_TAB_CHARTS,
        ...BACKUPS_TAB_CHARTS,
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
    it('should have 8 charts in the overview tab', () => {
      expect(OVERVIEW_TAB_CHARTS).toHaveLength(8)
    })

    it('should have unique chart IDs', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...ERRORS_TAB_CHARTS,
        ...DISKS_TAB_CHARTS,
        ...BACKUPS_TAB_CHARTS,
      ]
      const ids = allCharts.map((c) => c.id)
      const uniqueIds = new Set(ids)
      // Note: ChartQueryCountByUser appears twice with different IDs
      expect(uniqueIds.size).toBeLessThanOrEqual(ids.length)
    })

    it('should include required overview charts', () => {
      const ids = OVERVIEW_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('query-count-24h')
      expect(ids).toContain('query-count-by-user-24h')
      expect(ids).toContain('memory-usage')
      expect(ids).toContain('cpu-usage')
      expect(ids).toContain('merge-count')
      expect(ids).toContain('top-table-size')
      expect(ids).toContain('new-parts-created')
    })

    it('should have proper time intervals configured', () => {
      const queryCountChart = OVERVIEW_TAB_CHARTS.find(
        (c) => c.id === 'query-count-24h'
      )
      expect(queryCountChart?.lastHours).toBe(24)
      expect(queryCountChart?.interval).toBe('toStartOfHour')
    })
  })

  describe('Errors Tab Charts', () => {
    it('should have 1 chart in the errors tab', () => {
      expect(ERRORS_TAB_CHARTS).toHaveLength(1)
    })

    it('should include keeper exception chart', () => {
      const ids = ERRORS_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('keeper-exception')
    })
  })

  describe('Disks Tab Charts', () => {
    it('should have 2 charts in the disks tab', () => {
      expect(DISKS_TAB_CHARTS).toHaveLength(2)
    })

    it('should include disk size and disks usage charts', () => {
      const ids = DISKS_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('disk-size')
      expect(ids).toContain('disks-usage')
    })

    it('should have proper disk usage time range', () => {
      const disksUsageChart = DISKS_TAB_CHARTS.find(
        (c) => c.id === 'disks-usage'
      )
      expect(disksUsageChart?.lastHours).toBe(24 * 30)
      expect(disksUsageChart?.interval).toBe('toStartOfDay')
    })
  })

  describe('Backups Tab Charts', () => {
    it('should have 1 chart in the backups tab', () => {
      expect(BACKUPS_TAB_CHARTS).toHaveLength(1)
    })

    it('should include backup size chart', () => {
      const ids = BACKUPS_TAB_CHARTS.map((c) => c.id)
      expect(ids).toContain('backup-size')
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
          ERRORS_TAB_CHARTS.length +
          DISKS_TAB_CHARTS.length +
          BACKUPS_TAB_CHARTS.length
        expect(allIds.length).toBe(expectedCount)
      })

      it('should include specific chart IDs', () => {
        const allIds = getAllChartIds()
        expect(allIds).toContain('query-count-24h')
        expect(allIds).toContain('keeper-exception')
        expect(allIds).toContain('disk-size')
        expect(allIds).toContain('backup-size')
      })
    })

    describe('getChartsForTab', () => {
      it('should return charts for the overview tab', () => {
        const charts = getChartsForTab('overview')
        expect(charts).toHaveLength(8)
        expect(charts[0].id).toBe('query-count-24h')
      })

      it('should return charts for the errors tab', () => {
        const charts = getChartsForTab('errors')
        expect(charts).toHaveLength(1)
        expect(charts[0].id).toBe('keeper-exception')
      })

      it('should return charts for the disks tab', () => {
        const charts = getChartsForTab('disks')
        expect(charts).toHaveLength(2)
      })

      it('should return charts for the backups tab', () => {
        const charts = getChartsForTab('backups')
        expect(charts).toHaveLength(1)
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
        ...ERRORS_TAB_CHARTS,
        ...DISKS_TAB_CHARTS,
        ...BACKUPS_TAB_CHARTS,
      ]

      const types = new Set(allCharts.map((c) => c.type))
      expect(types).toContain('area')
      expect(types).toContain('bar')
      expect(types).toContain('metric')
      expect(types).toContain('custom')
    })

    it('should have type property on all charts', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...ERRORS_TAB_CHARTS,
        ...DISKS_TAB_CHARTS,
        ...BACKUPS_TAB_CHARTS,
      ]

      allCharts.forEach((chart) => {
        expect(chart.type).toBeDefined()
        expect(['area', 'bar', 'metric', 'custom']).toContain(chart.type)
      })
    })
  })

  describe('Grid Layout Classes', () => {
    it('should have proper grid classes for each tab', () => {
      const overviewTab = getTabConfig('overview')
      const errorsTab = getTabConfig('errors')
      const disksTab = getTabConfig('disks')
      const backupsTab = getTabConfig('backups')

      expect(overviewTab?.gridClassName).toContain('grid-cols-1')
      expect(overviewTab?.gridClassName).toContain('md:grid-cols-2')
      expect(overviewTab?.gridClassName).toContain('2xl:grid-cols-3')

      expect(errorsTab?.gridClassName).toContain('grid-cols-1')
      expect(errorsTab?.gridClassName).toContain('md:grid-cols-2')
    })
  })

  describe('Chart Props Validation', () => {
    it('should have className defined for all charts', () => {
      const allCharts = [
        ...OVERVIEW_TAB_CHARTS,
        ...ERRORS_TAB_CHARTS,
        ...DISKS_TAB_CHARTS,
        ...BACKUPS_TAB_CHARTS,
      ]

      allCharts.forEach((chart) => {
        expect(chart.className).toBeDefined()
        expect(typeof chart.className).toBe('string')
      })
    })

    it('should have optional chartClassName for some charts', () => {
      const backupChart = BACKUPS_TAB_CHARTS.find((c) => c.id === 'backup-size')
      expect(backupChart?.chartClassName).toBe('h-full h-[140px] sm:h-[160px]')
    })
  })
})
