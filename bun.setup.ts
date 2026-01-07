// Bun test setup file for global configuration
// Next.js modules are mocked via moduleNameMapper in jest.config.js
// Bun respects TypeScript path aliases natively, so @/ imports work automatically
import { jest } from 'bun:test'

// Mock environment variables
// Use a cast to bypass readonly check for test environment
void process.env.NODE_ENV && (process.env.NODE_ENV = 'test')
void process.env.CI && (process.env.CI = 'true') // Force CI mode to skip integration tests
void process.env.CLICKHOUSE_HOST &&
  (process.env.CLICKHOUSE_HOST = 'http://localhost:8123')
void process.env.CLICKHOUSE_USER && (process.env.CLICKHOUSE_USER = 'default')
void process.env.CLICKHOUSE_PASSWORD && (process.env.CLICKHOUSE_PASSWORD = '')

// Only mock core modules that are safe to mock globally
// Individual tests should handle their own specific mocking needs

// Suppress console outputs in tests to prevent hanging
const originalConsole = { ...console }
// Bun supports jest.fn() for compatibility
const mockFn = (): void => undefined

global.console = {
  ...console,
  // Suppress specific logs during tests if needed
  log: mockFn,
  debug: mockFn,
  info: mockFn,
  warn: mockFn, // Also suppress warnings
  error: originalConsole.error, // Keep errors for debugging
}

// Test utilities for integration tests
// Bun supports jest.fn() natively for compatibility
const mockFetchData = jest.fn(() =>
  Promise.resolve({
    data: [],
    metadata: { queryId: 'test', duration: 0, rows: 0, host: 'test' },
  })
)

const mockGetHostIdCookie = jest.fn(() => Promise.resolve(0))

const testUtils = {
  switchHost: (hostId: number) => {
    mockGetHostIdCookie.mockResolvedValue(hostId)
  },
  assertHostIdUsed: (expectedHostId: number) => {
    const lastCall =
      mockFetchData.mock.calls[mockFetchData.mock.calls.length - 1]
    const args = lastCall?.[0] as { hostId?: number } | undefined
    if (!lastCall || !args || args.hostId !== expectedHostId) {
      throw new Error(
        `Expected hostId ${expectedHostId}, but got ${args?.hostId}`
      )
    }
  },
  assertAllCallsHaveHostId: () => {
    const callsWithoutHostId = mockFetchData.mock.calls.filter(
      (call: unknown[]) => {
        const args = call[0] as { hostId?: number } | undefined
        return !args || args.hostId === undefined || args.hostId === null
      }
    )
    if (callsWithoutHostId.length > 0) {
      throw new Error(
        `Found ${callsWithoutHostId.length} fetchData calls without hostId parameter`
      )
    }
  },
}

// Export for integration tests
export { mockFetchData, mockGetHostIdCookie, testUtils }
