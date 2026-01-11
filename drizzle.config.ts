import { defineConfig } from 'drizzle-kit'
import { env } from './lib/env'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: env.DB_DIALECT === 'postgres' ? 'postgresql' : 'sqlite',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
