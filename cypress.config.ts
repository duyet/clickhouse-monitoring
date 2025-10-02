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
    openMode: 0
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // TODO: fix coverage
      require('@cypress/code-coverage/task')(on, config)

      // tell Cypress to use .babelrc file
      // and instrument the specs files
      // only the extra application files will be instrumented
      // not the spec files themselves

      // It's IMPORTANT to return the config object
      // with any changed environment variables
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
