# Drizzle ORM Setup

This document provides detailed information about the Drizzle ORM implementation in the ClickHouse monitoring application.

## Overview

The application uses Drizzle ORM as the primary database ORM for handling authentication, organizations, and host management. Drizzle provides type-safe database operations with support for multiple adapters.

## Configuration

### Database Adapters

The application supports three database adapters:

1. **SQLite** (`drizzle-orm/better-sqlite3`)
   - Default for development
   - File-based, no server required
   - Simple setup and migration

2. **PostgreSQL** (`drizzle-orm/pg-core`)
   - Production-ready
   - Advanced features and performance
   - Connection pooling support

3. **Cloudflare D1** (`drizzle-orm/d1`)
   - Serverless database
   - Integrated with Cloudflare Workers
   - Global distribution

### Connection Setup

The database connection is configured in `lib/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

const sqlite = new Database('./sqlite.db')
export const db = drizzle(sqlite, { schema })
```

## Schema Definition

The schema is defined in `lib/db/schema.ts` using TypeScript interfaces. Drizzle provides schema builders for type-safe table definitions.

### Key Tables

#### Users
Stores user authentication information:
```typescript
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull().default('user'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
})
```

#### Organizations
Multi-tenant organization support:
```typescript
export const organizations = sqliteTable('organizations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  settings: text('settings'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
})
```

#### Hosts
Encrypted ClickHouse host configurations:
```typescript
export const hosts = sqliteTable('hosts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').default(9000),
  username: text('username'),
  encryptedPassword: blob('encrypted_password'), // AES-256-GCM encrypted
  encryptionKeyVersion: integer('encryption_key_version').default(1),
  // ... other fields
})
```

## Repository Pattern

The application uses a repository pattern for data access:

```typescript
export class UserRepository {
  async findById(id: number) {
    return db.select().from(schema.users).where(eq(schema.users.id, id))
  }

  async create(data: Omit<NewUser, 'id'>) {
    return db.insert(schema.users).values(data).returning()
  }
}
```

### Benefits

- **Type Safety**: Full TypeScript support with compile-time checking
- **Query Building**: Fluent API for complex queries
- **Migrations**: Automatic schema migration management
- **Relations**: Easy relationship handling with joins
- **Transactions**: Built-in transaction support

## Migrations

### Migration Commands

```bash
# Generate migration from schema changes
bun run db:generate

# Run pending migrations
bun run db:migrate

# Push schema changes directly (development only)
bun run db:push

# Open database studio
bun run db:studio
```

### Migration Files

Migrations are stored in `lib/db/migrations/` and follow this structure:
```
lib/db/migrations/
├── 0000_initial_schema.ts
├── 0001_add_host_encryption.ts
└── ...
```

### Custom Migrations

For complex schema changes, create custom migrations:

```typescript
import { type AnyPgTable, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const addNewTable = migration(async (db, { sql }) => {
  await sql`
    CREATE TABLE new_table (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
})

export const dropNewTable = migration(async (db, { sql }) => {
  await sql`DROP TABLE new_table`
})
```

## Queries

### Select Queries

```typescript
// Simple select
const users = await db.select().from(schema.users)

// With where clause
const activeUsers = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.isActive, true))

// With joins
const orgMembers = await db
  .select()
  .from(schema.organizationMembers)
  .leftJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
  .where(eq(schema.organizationMembers.organizationId, orgId))
```

### Insert Queries

```typescript
// Single insert
const newUser = await db
  .insert(schema.users)
  .values({ email: 'user@example.com', name: 'John Doe' })
  .returning()

// Bulk insert
const inserted = await db
  .insert(schema.users)
  .values([
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ])
  .returning()
```

### Update Queries

```typescript
// Simple update
const updated = await db
  .update(schema.users)
  .set({ name: 'New Name' })
  .where(eq(schema.users.id, userId))

// Conditional update
const result = await db
  .update(schema.users)
  .set({
    lastLogin: new Date(),
    loginCount: sql`${schema.users.loginCount} + 1`
  })
  .where(eq(schema.users.id, userId))
```

### Delete Queries

```typescript
// Simple delete
await db
  .delete(schema.users)
  .where(eq(schema.users.id, userId))

// With cascade
await db
  .delete(schema.organizations)
  .where(eq(schema.organizations.id, orgId))
```

## Transactions

```typescript
// Manual transaction
await db.transaction(async (tx) => {
  // Create organization
  const org = await tx
    .insert(schema.organizations)
    .values({ name: 'New Org' })
    .returning()
    .then(rows => rows[0])

  // Add user as member
  await tx.insert(schema.organizationMembers).values({
    organizationId: org.id,
    userId: userId,
    role: 'owner'
  })
})

// Transaction with savepoint
await db.transaction(async (tx) => {
  try {
    // Operations that might fail
    await tx.insert(schema.users).values(...)
    await tx.insert(schema.organizations).values(...)
  } catch (error) {
    // Rollback to savepoint
    await tx.rollback()
    throw error
  }
})
```

## Relations

### One-to-Many

```typescript
// User has many hosts
const userHosts = await db
  .select()
  .from(schema.hosts)
  .where(eq(schema.hosts.organizationId, orgId))
  .leftJoin(schema.organizations, eq(schema.hosts.organizationId, schema.organizations.id))
```

### Many-to-Many

```typescript
// User belongs to many organizations
const userOrgs = await db
  .select()
  .from(schema.organizationMembers)
  .where(eq(schema.organizationMembers.userId, userId))
  .leftJoin(schema.organizations, eq(schema.organizationMembers.organizationId, schema.organizations.id))
```

## Indexes

Indexes are defined inline in the schema:

```typescript
export const users = sqliteTable('users', {
  // ... columns
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}))
```

## Best Practices

1. **Use Repository Pattern**: Abstract database operations behind repositories
2. **Type Queries**: Always use Drizzle's type-safe query builders
3. **Handle Errors**: Proper error handling for database operations
4. **Transactions**: Use transactions for multi-table operations
5. **Indexes**: Add indexes for frequently queried columns
6. **Migrations**: Always use migrations for schema changes
7. **Security**: Never store sensitive data in plain text

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all schema imports are correct
2. **Migration Conflicts**: Resolve migration lock issues
3. **Connection Pooling**: Configure for high-traffic applications
4. **Query Performance**: Use EXPLAIN ANALYZE to optimize queries

### Debug Mode

Enable debug logging:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3'

const db = drizzle(sqlite, {
  schema,
  logger: true, // Enable query logging
})
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit CLI](https://orm.drizzle.team/cli/overview)
- [Type Safety Guide](https://orm.drizzle.team/guides/type-safety)
- [Migrations Guide](https://orm.drizzle.team/guides/migrations)