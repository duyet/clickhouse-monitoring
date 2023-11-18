import { defineConfig } from 'cypress'

export default defineConfig({
  defaultCommandTimeout: 15000,
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
