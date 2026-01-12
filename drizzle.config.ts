import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config()

const dialect = process.env.DB_DIALECT || 'sqlite'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: dialect as 'sqlite' | 'postgres',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ...(dialect === 'postgres' ? { provider: 'pg' } : {}),
  },
} satisfies Config
