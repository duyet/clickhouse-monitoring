import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '8zgiqh',
  defaultCommandTimeout: 30000,
  requestTimeout: 15000,
  responseTimeout: 30000,
  pageLoadTimeout: 60000,
  taskTimeout: 60000,
  execTimeout: 60000,
  fixturesFolder: 'cypress/fixtures',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Code coverage integration with @cypress/code-coverage
      // Note: Coverage requires babel instrumentation which conflicts with
      // Next.js 15's turbopack. To enable coverage:
      // 1. Create .babelrc with istanbul plugin
      // 2. Disable turbopack for e2e tests
      // 3. Run with NEXT_TURBO=false for coverage builds
      require('@cypress/code-coverage/task')(on, config)

      // The config object must be returned for Cypress to pick up
      // any changed environment variables
      return config
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    excludeSpecPattern: ['**/menu*/*'],
  },
})
