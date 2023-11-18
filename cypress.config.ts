import { defineConfig } from 'cypress'

export default defineConfig({
  defaultCommandTimeout: 15000,
  fixturesFolder: false,
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
