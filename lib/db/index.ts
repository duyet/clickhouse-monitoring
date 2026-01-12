import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

export { schema }

// Create a persistent database connection
const sqlite = new Database('./data/app.db')
// Ensure directory exists
import { mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const dbDir = dirname('./data/app.db')
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

export const db = drizzle(sqlite, { schema })

export function createDb(database: Database) {
  return drizzle(database, { schema })
}
