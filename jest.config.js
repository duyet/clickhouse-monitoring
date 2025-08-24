/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Remove the React mapping that's causing issues with react-is
    // Only use path aliases for the workspace
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Ensure Jest can find react-is properly
  transformIgnorePatterns: [
    'node_modules/(?!(react-is)/)',
  ],
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
  // Add timeout configuration to prevent hanging tests
  testTimeout: 30000, // 30 seconds default timeout
  // Setup file for test utilities and mocks
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}
