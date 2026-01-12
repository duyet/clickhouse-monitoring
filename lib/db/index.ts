import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"

// Initialize database connection
const sqlite = new Database(process.env.DATABASE_URL || "./data/app.db")
export const db = drizzle(sqlite, { schema })

// Function to run migrations
export function runMigrations() {
  try {
    migrate(db, { migrationsFolder: "./lib/db/migrations" })
    console.log("Database migrations completed successfully")
  } catch (error) {
    console.error("Database migration failed:", error)
    throw error
  }
}

// Initialize database on first run
if (process.env.NODE_ENV === "development") {
  // Check if database exists and has tables
  try {
    const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()
    if (!result) {
      console.log("Running initial database migration...")
      runMigrations()
    }
  } catch (error) {
    console.error("Error checking database:", error)
  }
}

export { schema }