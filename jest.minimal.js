/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  testTimeout: 5000,
  forceExit: true,
  detectOpenHandles: true,
  bail: false,
  testMatch: ['**/simple.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: false,
  verbose: true,
}
