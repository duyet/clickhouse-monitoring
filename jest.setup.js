/**
 * Jest setup file for ClickHouse monitoring dashboard
 * Provides mock utilities for testing without real database connections
 */

const { jest, beforeEach, expect } = require('@jest/globals')

// Mock fetchData function to prevent real database connections
const mockFetchData = jest.fn()

// Mock getHostIdCookie function
const mockGetHostIdCookie = jest.fn()

// Test utilities for host switching tests
const testUtils = {
  switchHost: (hostId) => {
    mockGetHostIdCookie.mockResolvedValue(hostId)
  },
  
  assertHostIdUsed: (expectedHostId) => {
    const lastCall = mockFetchData.mock.calls[mockFetchData.mock.calls.length - 1]
    expect(lastCall[0]).toHaveProperty('hostId', expectedHostId)
  },
  
  assertAllCallsHaveHostId: () => {
    const callsWithoutHostId = mockFetchData.mock.calls.filter(
      (call) => !call[0].hasOwnProperty('hostId')
    )
    
    if (callsWithoutHostId.length > 0) {
      throw new Error(
        `Found ${callsWithoutHostId.length} fetchData calls without hostId parameter. ` +
        'All fetchData calls must include hostId for multi-host support.'
      )
    }
  },
  
  reset: () => {
    mockFetchData.mockReset()
    mockGetHostIdCookie.mockReset()
  }
}

// Default mock implementations
mockFetchData.mockImplementation(async ({ query, hostId }) => {
  // Simulate database response based on hostId
  const mockData = {
    '0': { data: [{ host: 'localhost:8123', count: 100 }], metadata: { rows: 1, duration: 0.1 } },
    '1': { data: [{ host: 'localhost:8124', count: 200 }], metadata: { rows: 1, duration: 0.1 } },
  }
  
  return mockData[hostId] || { data: [], metadata: { rows: 0, duration: 0.1 } }
})

mockGetHostIdCookie.mockResolvedValue('0')

// Export for use in test files
module.exports = {
  mockFetchData,
  mockGetHostIdCookie,
  testUtils,
}

// Note: Global beforeEach hooks can cause issues
// Individual tests should set up their own mocks as needed