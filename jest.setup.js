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