# Drizzle ORM Setup Guide

Drizzle ORM is used for type-safe database interactions with support for SQLite, PostgreSQL, and other databases.

## Installation

The package is already included in dependencies. If you need to reinstall:

```bash
bun add drizzle-orm
bun add -D drizzle-kit
```

## Configuration

### 1. Environment Variables

Set in `.env.local`:

```env
DATABASE_URL="file:./data/app.db"
DB_DIALECT="sqlite"  # or "postgres"
```

### 2. Configuration File

Drizzle config is in `drizzle.config.ts`:

```typescript
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
```

### 3. Schema Definition

Schema is in `lib/db/schema.ts` with full type definitions.

## Commands

### Generate Migration

```bash
bun run db:generate
# or
npx drizzle-kit generate
```

### Run Migration

```bash
bun run db:migrate
# or
npx drizzle-kit migrate
```

### Push Schema (Development)

```bash
bun run db:push
# or
npx drizzle-kit push
```

### Drop All Data

```bash
bun run db:drop
# or
npx drizzle-kit drop
```

### Check Status

```bash
bun run db:status
```

## Using Drizzle in Application

### Query Examples

```typescript
import { db } from '@/lib/db'
import { users, organizations, hosts } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Find user by email
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com')
})

// Get organization with members
const org = await db.query.organizations.findFirst({
  where: eq(organizations.slug, 'my-org'),
  with: {
    members: {
      with: { user: true }
    }
  }
})

// Create new organization
const newOrg = await db.insert(organizations).values({
  name: 'My Org',
  slug: 'my-org',
  createdBy: userId
}).returning()

// Update host
await db.update(hosts)
  .set({ lastConnectedAt: new Date() })
  .where(eq(hosts.id, hostId))

// Delete host
await db.delete(hosts).where(eq(hosts.id, hostId))
```

### Transaction Example

```typescript
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'

const result = await db.transaction(async (tx) => {
  // Create organization
  const org = await tx.insert(organizations).values({
    name: 'New Org',
    slug: 'new-org',
    createdBy: userId
  }).returning()

  // Add creator as owner
  await tx.insert(organizationMembers).values({
    organizationId: org[0].id,
    userId: userId,
    role: 'owner'
  })

  return org
})
```

## Type Inference

### TypeScript Types

```typescript
import type { User, Organization, Host } from '@/lib/db'

function processUser(user: User) {
  // Fully typed
  console.log(user.email)
}

function createOrganization(data: InsertOrganization) {
  // Insert type with optional fields
  return db.insert(organizations).values(data)
}
```

## Schema Details

### User Schema

```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  name: text('name'),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
```

### Organization Schema

```typescript
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
```

### Host Schema

```typescript
export const hosts = sqliteTable('hosts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  host: text('host').notNull(), // Encrypted
  port: integer('port').notNull(),
  username: text('username').notNull(), // Encrypted
  password: text('password').notNull(), // Encrypted
  protocol: text('protocol').notNull(),
  secure: integer('secure', { mode: 'boolean' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  lastConnectedAt: integer('last_connected_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
```

## Migrations

### Migration File Structure

```sql
-- lib/db/migrations/0000_initial_schema.sql

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  -- ...
);

CREATE INDEX idx_users_email ON users(email);
```

### Running Migrations in Production

```typescript
// In your application startup
import { initializeDatabase } from '@/lib/db'

initializeDatabase()
  .then(() => console.log('Database initialized'))
  .catch(console.error)
```

## Common Patterns

### Soft Deletes

```typescript
// Add deleted column to schema
export const users = sqliteTable('users', {
  // ... other fields
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})

// "Soft delete" by setting timestamp
await db.update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId))

// Query only active records
const activeUsers = await db.query.users.findMany({
  where: isNull(users.deletedAt)
})
```

### Audit Trails

```typescript
// Before/After hooks
export const auditHooks = {
  insert: async (table: string, data: any, user?: string) => {
    await db.insert(auditLog).values({
      userId: user,
      action: `insert.${table}`,
      metadata: JSON.stringify(data),
      success: true
    })
  }
}
```

## Troubleshooting

### Schema Mismatch

```bash
# Check for differences
npx drizzle-kit push --dry-run
```

### Migration Conflicts

```bash
# Reset and regenerate
rm -rf lib/db/migrations/*
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Type Errors

```bash
# Regenerate types
bun run type-check
```

## Best Practices

1. **Always use type inference** for queries
2. **Index foreign keys** for performance
3. **Use transactions** for complex operations
4. **Version control migrations**
5. **Test migrations** before production
6. **Use prepared statements** for user input