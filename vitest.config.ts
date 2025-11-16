import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      '**/*.cy.{ts,tsx}',
      '**/query-config.test.ts', // Skip as per original config
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './vitest-reports/coverage',
      exclude: [
        '**/node_modules/**',
        '**/*.config.{ts,js}',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.cy.{ts,tsx}',
        '**/cypress/**',
        '**/.next/**',
        '**/dist/**',
        '**/types/**',
      ],
    },
    // Much faster than Jest
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false, // Use multiple threads for speed
      },
    },
    // Reasonable timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
