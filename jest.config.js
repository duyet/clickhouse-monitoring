/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // resolve react module with the next.js inset one.
    react: 'next/dist/compiled/react/cjs/react.development.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
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
}
