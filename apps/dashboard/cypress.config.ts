import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '8zgiqh',
  // 8 s is enough for all real assertions; prevents a hung test from burning
  // 30 s per attempt (the old value that caused the 30-min CI timeout).
  defaultCommandTimeout: 8000,
  requestTimeout: 10000,
  responseTimeout: 15000,
  pageLoadTimeout: 60000,
  taskTimeout: 60000,
  execTimeout: 60000,
  fixturesFolder: 'cypress/fixtures',
  retries: {
    runMode: 1,
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

      // Custom task to check environment variables
      on('task', {
        checkEnvVar(envVar: string) {
          return !!process.env[envVar]
        },
      })

      // The config object must be returned for Cypress to pick up
      // any changed environment variables
      config.env ??= {}
      config.env.AGENT_API_TOKEN = process.env.AGENT_API_TOKEN ?? ''
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
