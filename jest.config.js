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
  },
  // Ensure Jest can handle ESM and problematic modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-is|@clickhouse)/)',
  ],
  // Force single worker to prevent concurrency issues
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
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
  // Timeout configuration
  testTimeout: 30000,
  // Setup file for test utilities and mocks
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}
