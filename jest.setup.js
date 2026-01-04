// Jest setup file for global configuration
// Next.js modules are mocked via moduleNameMapper in jest.config.js

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.CI = 'true' // Force CI mode to skip integration tests
process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
process.env.CLICKHOUSE_USER = 'default'
process.env.CLICKHOUSE_PASSWORD = ''

// Only mock core modules that are safe to mock globally
// Individual tests should handle their own specific mocking needs

// Suppress console outputs in tests to prevent hanging
const originalConsole = { ...console }
global.console = {
  ...console,
  // Suppress specific logs during tests if needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(), // Also suppress warnings
  error: originalConsole.error, // Keep errors for debugging
}

// Test utilities for integration tests
const mockFetchData = jest.fn(() =>
  Promise.resolve({
    data: [],
    metadata: { queryId: 'test', duration: 0, rows: 0, host: 'test' },
  })
)

const mockGetHostIdCookie = jest.fn(() => Promise.resolve(0))

const testUtils = {
  switchHost: (hostId) => {
    mockGetHostIdCookie.mockResolvedValue(hostId)
  },
  assertHostIdUsed: (expectedHostId) => {
    const lastCall =
      mockFetchData.mock.calls[mockFetchData.mock.calls.length - 1]
    if (!lastCall || !lastCall[0] || lastCall[0].hostId !== expectedHostId) {
      throw new Error(
        `Expected hostId ${expectedHostId}, but got ${lastCall?.[0]?.hostId}`
      )
    }
  },
  assertAllCallsHaveHostId: () => {
    const callsWithoutHostId = mockFetchData.mock.calls.filter(
      (call) =>
        !call[0] || call[0].hostId === undefined || call[0].hostId === null
    )
    if (callsWithoutHostId.length > 0) {
      throw new Error(
        `Found ${callsWithoutHostId.length} fetchData calls without hostId parameter`
      )
    }
  },
}

// Export for integration tests
module.exports = {
  mockFetchData,
  mockGetHostIdCookie,
  testUtils,
}
