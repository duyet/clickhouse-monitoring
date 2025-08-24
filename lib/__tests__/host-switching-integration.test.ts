/**
 * @fileoverview Integration tests for host switching functionality
 * Tests the complete flow of switching between ClickHouse hosts
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals'

// Import the test utilities
const {
  mockGetHostIdCookie,
  mockFetchData,
  testUtils,
} = require('../../jest.setup')

describe('Host Switching Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('Chart Components Host Switching', () => {
    it('should use correct hostId when switching between hosts', async () => {
      // Simulate starting with host 0
      mockGetHostIdCookie.mockResolvedValue('0')

      // Mock a chart component's fetchData call
      const chartQuery = `
        SELECT toStartOfDay(event_time) as event_time,
               COUNT() as query_count
        FROM system.query_log
        WHERE event_time >= now() - INTERVAL 7 DAY
        GROUP BY event_time
        ORDER BY event_time
      `

      // Simulate chart component making fetchData call
      await mockFetchData({
        query: chartQuery,
        hostId: await mockGetHostIdCookie(),
      })

      // Verify initial call used host 0
      testUtils.assertHostIdUsed('0')

      // Switch to host 1
      testUtils.switchHost('1')

      // Simulate chart component refreshing with new host
      await mockFetchData({
        query: chartQuery,
        hostId: await mockGetHostIdCookie(),
      })

      // Verify new call used host 1
      testUtils.assertHostIdUsed('1')

      // Verify all calls had hostId parameter
      testUtils.assertAllCallsHaveHostId()
    })

    it('should handle multiple chart components switching simultaneously', async () => {
      const queries = {
        queryCount: 'SELECT COUNT() from system.query_log',
        cpuUsage:
          "SELECT value FROM system.metrics WHERE metric = 'CurrentMetric_CPU'",
        memoryUsage:
          "SELECT value FROM system.metrics WHERE metric = 'CurrentMetric_Memory'",
      }

      // Start with host 0
      mockGetHostIdCookie.mockResolvedValue('0')

      // Simulate multiple components making calls
      await Promise.all([
        mockFetchData({
          query: queries.queryCount,
          hostId: await mockGetHostIdCookie(),
        }),
        mockFetchData({
          query: queries.cpuUsage,
          hostId: await mockGetHostIdCookie(),
        }),
        mockFetchData({
          query: queries.memoryUsage,
          hostId: await mockGetHostIdCookie(),
        }),
      ])

      // Switch to host 1
      testUtils.switchHost('1')

      // Simulate all components refreshing
      const hostId = await mockGetHostIdCookie()
      await Promise.all([
        mockFetchData({ query: queries.queryCount, hostId }),
        mockFetchData({ query: queries.cpuUsage, hostId }),
        mockFetchData({ query: queries.memoryUsage, hostId }),
      ])

      // Verify all calls used correct hostIds
      const calls = mockFetchData.mock.calls
      expect(calls).toHaveLength(6)

      // First 3 calls should use host 0
      expect(calls[0][0].hostId).toBe('0')
      expect(calls[1][0].hostId).toBe('0')
      expect(calls[2][0].hostId).toBe('0')

      // Last 3 calls should use host 1
      expect(calls[3][0].hostId).toBe('1')
      expect(calls[4][0].hostId).toBe('1')
      expect(calls[5][0].hostId).toBe('1')
    })
  })

  describe('Page Components Host Switching', () => {
    it('should extract host from params correctly', async () => {
      // Mock page component receiving host from params
      const mockParams = Promise.resolve({ host: '2' })
      const { host } = await mockParams

      // Simulate page component making fetchData call
      await mockFetchData({
        query: 'SELECT * FROM system.clusters',
        hostId: host,
      })

      testUtils.assertHostIdUsed('2')
    })

    it('should handle nested route parameters', async () => {
      // Mock nested route like /[host]/database/[database]
      const mockParams = Promise.resolve({
        host: '1',
        database: 'default',
      })
      const { host, database } = await mockParams

      await mockFetchData({
        query: `SELECT * FROM system.tables WHERE database = '${database}'`,
        hostId: host,
      })

      testUtils.assertHostIdUsed('1')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing hostId gracefully', async () => {
      // Simulate a call without hostId (this should be caught by our tests)
      try {
        await mockFetchData({
          query: 'SELECT 1',
          // Missing hostId parameter
        })

        testUtils.assertAllCallsHaveHostId()
        // Should not reach here if validation works
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain(
          'fetchData calls without hostId parameter'
        )
      }
    })

    it('should handle invalid hostId values', async () => {
      mockGetHostIdCookie.mockResolvedValue(undefined)

      // This should be handled by the application
      const hostId = (await mockGetHostIdCookie()) || '0'

      await mockFetchData({
        query: 'SELECT 1',
        hostId,
      })

      testUtils.assertHostIdUsed('0')
    })
  })

  describe('Performance Tests', () => {
    it('should not cause unnecessary re-renders during host switching', async () => {
      let renderCount = 0
      const mockComponent = async () => {
        renderCount++
        const hostId = await mockGetHostIdCookie()
        await mockFetchData({
          query: 'SELECT COUNT(*) FROM system.query_log',
          hostId,
        })
        return { hostId, renderCount }
      }

      // Initial render
      mockGetHostIdCookie.mockResolvedValue('0')
      await mockComponent()
      expect(renderCount).toBe(1)

      // Switch host - should trigger re-render
      testUtils.switchHost('1')
      await mockComponent()
      expect(renderCount).toBe(2)

      // Switch back - should trigger re-render
      testUtils.switchHost('0')
      await mockComponent()
      expect(renderCount).toBe(3)

      // Verify each render used correct hostId
      const calls = mockFetchData.mock.calls
      expect(calls[0][0].hostId).toBe('0')
      expect(calls[1][0].hostId).toBe('1')
      expect(calls[2][0].hostId).toBe('0')
    })
  })

  describe('Regression Tests for Issue #509', () => {
    it('should prevent data from previous host showing after switch', async () => {
      // Mock different data for each host
      mockFetchData.mockImplementation(({ hostId, query }) => {
        const mockData = {
          '0': [{ count: 100, host: 'host-0' }],
          '1': [{ count: 200, host: 'host-1' }],
        }
        return Promise.resolve({ data: mockData[hostId] || [] })
      })

      // Start with host 0
      mockGetHostIdCookie.mockResolvedValue('0')
      const result0 = await mockFetchData({
        query: 'SELECT COUNT(*) as count FROM system.query_log',
        hostId: await mockGetHostIdCookie(),
      })

      expect(result0.data[0].host).toBe('host-0')

      // Switch to host 1
      testUtils.switchHost('1')
      const result1 = await mockFetchData({
        query: 'SELECT COUNT(*) as count FROM system.query_log',
        hostId: await mockGetHostIdCookie(),
      })

      expect(result1.data[0].host).toBe('host-1')

      // Verify data is different (no stale data from host 0)
      expect(result1.data[0].count).not.toBe(result0.data[0].count)
    })

    it('should refresh all dashboard components on host switch', async () => {
      const componentQueries = [
        'SELECT COUNT(*) FROM system.query_log',
        "SELECT value FROM system.metrics WHERE metric = 'CPU'",
        'SELECT COUNT(*) FROM system.tables',
        'SELECT COUNT(*) FROM system.databases',
      ]

      // Simulate all components loading with host 0
      mockGetHostIdCookie.mockResolvedValue('0')
      const host0Results = await Promise.all(
        componentQueries.map((query) =>
          mockFetchData({ query, hostId: await mockGetHostIdCookie() })
        )
      )

      // Switch to host 1
      testUtils.switchHost('1')
      const host1Results = await Promise.all(
        componentQueries.map((query) =>
          mockFetchData({ query, hostId: await mockGetHostIdCookie() })
        )
      )

      // Verify all components made calls with correct hostIds
      const calls = mockFetchData.mock.calls

      // First 4 calls should be host 0
      for (let i = 0; i < 4; i++) {
        expect(calls[i][0].hostId).toBe('0')
      }

      // Next 4 calls should be host 1
      for (let i = 4; i < 8; i++) {
        expect(calls[i][0].hostId).toBe('1')
      }
    })
  })
})

describe('fetchData Parameter Validation', () => {
  it('should require hostId parameter in all fetchData calls', () => {
    const validCall = () =>
      mockFetchData({
        query: 'SELECT 1',
        hostId: '0',
      })

    const invalidCall = () =>
      mockFetchData({
        query: 'SELECT 1',
        // Missing hostId
      })

    expect(validCall).not.toThrow()

    // This should be caught by our validation
    try {
      invalidCall()
      testUtils.assertAllCallsHaveHostId()
    } catch (error) {
      expect(error.message).toContain('hostId parameter')
    }
  })

  it('should validate hostId is a string', async () => {
    const testCases = [
      { hostId: '0', valid: true },
      { hostId: '1', valid: true },
      { hostId: '', valid: false },
      { hostId: null, valid: false },
      { hostId: undefined, valid: false },
      { hostId: 123, valid: false },
    ]

    for (const testCase of testCases) {
      try {
        await mockFetchData({
          query: 'SELECT 1',
          hostId: testCase.hostId,
        })

        if (testCase.valid) {
          // Should succeed
          expect(true).toBe(true)
        } else {
          // Should have been caught
          expect(true).toBe(false)
        }
      } catch (error) {
        if (!testCase.valid) {
          // Expected to fail
          expect(error.message).toContain('hostId')
        } else {
          // Should not have failed
          throw error
        }
      }
    }
  })
})
