import { vi } from 'vitest'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.CLICKHOUSE_HOST = 'http://localhost:8123'
process.env.CLICKHOUSE_USER = 'default'
process.env.CLICKHOUSE_PASSWORD = ''

// Mock ClickHouse clients
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => ({
    query: vi.fn(),
    command: vi.fn(),
    insert: vi.fn(),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('@clickhouse/client-web', () => ({
  createClient: vi.fn(() => ({
    query: vi.fn(),
    command: vi.fn(),
    insert: vi.fn(),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}))

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  headers: vi.fn(() => new Map()),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}))

// Mock server-only-context
vi.mock('server-only-context', () => ({
  createServerContext: vi.fn(() => ({
    get: vi.fn(() => 0),
    set: vi.fn(),
  })),
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress debug and log in tests unless explicitly needed
  debug: vi.fn(),
  log: process.env.VITEST_VERBOSE === 'true' ? console.log : vi.fn(),
}
