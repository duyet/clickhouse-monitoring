// @ts-nocheck — test helper, only runs under bun:test
/**
 * Shared mock setup for AI agent tool tests.
 *
 * PROBLEM: bun:test's mock.module() is process-global. When multiple test
 * files mock '@chm/clickhouse-client' with different implementations, the
 * last one to load wins, breaking all others.
 *
 * SOLUTION: This file registers ALL mock.module() calls ONCE with shared
 * mock functions. Each test customizes behavior per-test via
 * mockImplementation() inside each test() callback.
 *
 * USAGE in test files:
 *   import { mockFetchData } from './shared-mocks'
 *   // Don't call mock.module() yourself — just import and use mockFetchData
 *   test('my test', async () => {
 *     mockFetchData.mockImplementation(async ({ query }) => { ... })
 *     // ... test code
 *   })
 */
import { mock } from 'bun:test'

// Register mocks ONCE — these are hoisted and run before any imports
mock.module('server-only', () => ({}))

mock.module('@chm/sql-builder', () => ({
  validateSqlQuery: mock(() => {
    // passes by default
  }),
}))

mock.module('@/lib/utils', () => ({
  formatBytes: (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GiB`
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MiB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KiB`
    return `${bytes} B`
  },
}))

// Shared mock functions — tests customize via mockImplementation()
export const mockFetchData = mock(
  async (_params: { query: string; hostId?: number }) => ({
    data: [] as any[],
    error: null,
  })
) as any

mock.module('@chm/clickhouse-client', () => ({
  fetchData: mockFetchData,
  // findings-store (pulled in via the tools index) imports getClient at
  // module-eval time. Provide it so the import resolves; no agent-tool test
  // exercises the real write client here.
  getClient: async () => ({
    command: async () => ({}),
    insert: async () => ({}),
    query: async () => ({ json: async () => [] }),
  }),
}))
