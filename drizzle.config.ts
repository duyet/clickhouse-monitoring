import { detectDatabaseAdapter } from './lib/auth/config'
import { defineConfig } from 'drizzle-kit'

// Determine dialect based on environment
const adapter = detectDatabaseAdapter()

let dialect: 'sqlite' | 'postgresql' = 'sqlite'
if (adapter === 'postgres') {
  dialect = 'postgresql'
}

export default defineConfig({
  schema: './lib/db/schema/*.ts',
  out: './lib/db/migrations',
  dialect,
  dbCredentials:
    adapter === 'postgres'
      ? {
          url:
            process.env.DATABASE_URL ||
            'postgresql://localhost:5432/clickhouse-monitor',
        }
      : {
          url: process.env.DATABASE_URL || 'sqlite:./clickhouse-monitor.db',
        },
})
