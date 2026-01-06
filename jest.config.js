/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  projects: [
    // Main unit tests
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@clickhouse/client$': '<rootDir>/__mocks__/clickhouse-client.js',
        '^@clickhouse/client-web$': '<rootDir>/__mocks__/clickhouse-client.js',
        '^next/headers$': '<rootDir>/__mocks__/next-headers.js',
        '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
      },
      transformIgnorePatterns: ['node_modules/(?!(react-is|@clickhouse)/)'],
      testPathIgnorePatterns: ['/node_modules/', 'query-config'],
      maxWorkers: 1,
      testTimeout: 15000,
      forceExit: true,
      detectOpenHandles: true,
      detectLeaks: false,
      workerIdleMemoryLimit: '512MB',
      bail: false,
      verbose: false,
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
    },
    // Query-config integration tests
    {
      displayName: 'queries-config',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^next/headers$': '<rootDir>/__mocks__/next-headers.js',
        '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
      },
      transformIgnorePatterns: ['node_modules/(?!(@clickhouse)/)'],
      testMatch: ['**/query-config/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/'],
      maxWorkers: 1,
      forceExit: true,
      detectOpenHandles: true,
      testTimeout: 30000,
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
      verbose: true,
    },
  ],
}
