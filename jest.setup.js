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