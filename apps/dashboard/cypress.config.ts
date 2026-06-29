import { clerkSetup } from '@clerk/testing/cypress'
import { defineConfig } from 'cypress'

/**
 * Cypress config for the TanStack Start (Vite) dashboard.
 *
 * Differs from the Next app's config: component tests use the `react` +
 * `vite` devServer (not `next`/`webpack`). E2E `baseUrl` is overridable via
 * `CYPRESS_BASE_URL` so the same specs run against a local `vite preview`
 * (default :3000) or a live deployment (e.g. https://dash.chmonitor.dev)
 * for prod smoke/parity checks.
 *
 * Clerk testing: set CYPRESS_CLERK_PUBLISHABLE_KEY (pk_test_…) and
 * CLERK_SECRET_KEY (sk_test_…) to enable the authenticated billing/org specs.
 */
export default defineConfig({
  // 8s is enough for real assertions and prevents a hung test from burning the
  // full default budget (matches the Next app's tuned timeouts).
  defaultCommandTimeout: 8000,
  requestTimeout: 10000,
  responseTimeout: 15000,
  pageLoadTimeout: 60000,
  retries: { runMode: 1, openMode: 0 },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    async setupNodeEvents(_on, config) {
      // Wire @clerk/testing so the bot-protection bypass token is fetched
      // once per run. Skips gracefully when the keys are absent (CI without
      // Clerk credentials still runs anonymous specs without error).
      const publishableKey =
        process.env.CYPRESS_CLERK_PUBLISHABLE_KEY ??
        process.env.CHM_CLERK_PUBLISHABLE_KEY_TEST
      const secretKey = process.env.CLERK_SECRET_KEY
      if (publishableKey && secretKey) {
        await clerkSetup({
          config,
          options: { publishableKey, secretKey },
        })
      }
      return config
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.tsx',
    supportFile: 'cypress/support/component.ts',
  },
})
