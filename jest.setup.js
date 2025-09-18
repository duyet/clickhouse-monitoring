// Jest setup file for mocks and global configuration

// Mock Next.js modules that might cause issues
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock environment variables
process.env.CLICKHOUSE_HOST = 'http://localhost:8123';
process.env.CLICKHOUSE_USER = 'default';
process.env.CLICKHOUSE_PASSWORD = '';

// Mock fetchData globally to prevent actual ClickHouse calls
jest.mock('@/lib/clickhouse', () => ({
  fetchData: jest.fn(() => Promise.resolve({
    data: [],
    metadata: { queryId: 'test', duration: 0, rows: 0, host: 'test' }
  })),
}));

// Mock ClickHouse helpers
jest.mock('@/lib/clickhouse-helpers', () => ({
  fetchDataWithHost: jest.fn(() => Promise.resolve({
    data: [],
    metadata: { queryId: 'test', duration: 0, rows: 0, host: 'test' }
  })),
  validateHostId: jest.fn((id) => id || 0),
}));

// Mock getHostIdCookie
jest.mock('@/lib/scoped-link', () => ({
  getHostIdCookie: jest.fn(() => Promise.resolve(0)),
  scopedLink: jest.fn((url) => url),
  getScopedLink: jest.fn((url) => url),
}));

// Global test utilities if needed
global.console = {
  ...console,
  // Suppress specific logs during tests if needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Test utilities for integration tests
const mockFetchData = jest.fn(() => Promise.resolve({
  data: [],
  metadata: { queryId: 'test', duration: 0, rows: 0, host: 'test' }
}));

const mockGetHostIdCookie = jest.fn(() => Promise.resolve(0));

const testUtils = {
  switchHost: (hostId) => {
    mockGetHostIdCookie.mockResolvedValue(hostId);
  },
  assertHostIdUsed: (expectedHostId) => {
    const lastCall = mockFetchData.mock.calls[mockFetchData.mock.calls.length - 1];
    if (!lastCall || !lastCall[0] || lastCall[0].hostId !== expectedHostId) {
      throw new Error(`Expected hostId ${expectedHostId}, but got ${lastCall?.[0]?.hostId}`);
    }
  },
  assertAllCallsHaveHostId: () => {
    const callsWithoutHostId = mockFetchData.mock.calls.filter(call =>
      !call[0] || call[0].hostId === undefined || call[0].hostId === null
    );
    if (callsWithoutHostId.length > 0) {
      throw new Error(`Found ${callsWithoutHostId.length} fetchData calls without hostId parameter`);
    }
  }
};

// Export for integration tests
module.exports = {
  mockFetchData,
  mockGetHostIdCookie,
  testUtils
};