/**
 * Jest configuration for query-config integration tests
 *
 * This config is separate from the main jest.config.js because:
 * 1. Query-config tests need a real ClickHouse connection (no mocking)
 * 2. They run against the CI matrix of ClickHouse versions
 * 3. Main jest config ignores query-config to speed up unit tests
 *
 * Run with: bun run test-queries-config
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Path aliases for the workspace
    '^@/(.*)$': '<rootDir>/$1',
    // DO NOT mock ClickHouse clients - we need real connections
    // Mock Next.js modules since they're not needed for these tests
    '^next/headers$': '<rootDir>/__mocks__/next-headers.js',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
  },
  // Transform TypeScript files
  transformIgnorePatterns: ['node_modules/(?!(@clickhouse)/)'],
  // Only run query-config tests
  testMatch: ['**/query-config/**/*.test.ts'],
  // Ignore node_modules but NOT query-config
  testPathIgnorePatterns: ['/node_modules/'],
  // Single worker for stability
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  // Longer timeout for integration tests
  testTimeout: 30000,
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'jest-reports/coverage-query-config',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'jest-reports',
        outputName: 'junit-query-config.xml',
      },
    ],
    'summary',
  ],
  // Verbose output for CI debugging
  verbose: true,
}
