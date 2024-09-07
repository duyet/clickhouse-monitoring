import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '8zgiqh',
  defaultCommandTimeout: 15000,
  fixturesFolder: false,
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
