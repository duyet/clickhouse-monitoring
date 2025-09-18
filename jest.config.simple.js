/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    'query-config'
  ],
  maxWorkers: 1,
  testTimeout: 30000,
  forceExit: true,
  collectCoverage: true,
  coverageDirectory: 'jest-reports/coverage',
  reporters: ['default', 'summary']
}