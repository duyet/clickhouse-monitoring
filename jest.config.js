/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Only use path aliases for the workspace
    '^@/(.*)$': '<rootDir>/$1',
    // Mock potentially problematic modules
    '^@clickhouse/client$': '<rootDir>/__mocks__/clickhouse-client.js',
    '^@clickhouse/client-web$': '<rootDir>/__mocks__/clickhouse-client.js',
    // Mock Next.js modules to prevent hanging
    '^next/headers$': '<rootDir>/__mocks__/next-headers.js',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
  },
  // Ensure Jest can handle ESM and problematic modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-is|@clickhouse)/)',
  ],
  // Force single worker to prevent concurrency issues
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  detectLeaks: false, // Disable leak detection to prevent false positives
  // Verbose mode for debugging
  verbose: false,
  // Prevent worker hanging
  workerIdleMemoryLimit: '512MB',
  // Ignore query-config files as per original setup
  testPathIgnorePatterns: [
    '/node_modules/',
    'query-config'
  ],
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'jest-reports/coverage',
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: 'jest-reports', outputName: 'junit.xml' },
    ],
    ['github-actions', { silent: false }],
    'summary',
  ],
  // Aggressive timeout configuration
  testTimeout: 15000,
  // Prevent hanging tests
  bail: false, // Don't bail to see all failures
  // Setup file for test utilities and mocks
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}
