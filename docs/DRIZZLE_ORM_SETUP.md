# Drizzle ORM Setup

This document describes how Drizzle ORM is configured and used in the ClickHouse monitoring dashboard.

## Overview

Drizzle ORM is used as the primary database ORM for managing authentication, organization, and host data. It provides type-safe database operations and supports multiple database backends.

## Configuration

### Database Connection

The database connection is configured in `drizzle.config.ts`:

```typescript
import type { Config } from "drizzle-kit"
import * as dotenv from "dotenv"

dotenv.config()

const dialect = process.env.DB_DIALECT || "sqlite"

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: dialect as "sqlite" | "postgres",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ...(dialect === "postgres" ? { provider: "pg" } : {}),
  },
} satisfies Config
```

### Schema Definition

The database schema is defined in `lib/db/schema.ts`:

```typescript
import { sql } from "drizzle-orm"
import { integer, text, sqliteTable, unique } from "drizzle-orm/sqlite-core"
import { createId } from "@paralleldrive/cuid2"

// Auth tables (managed by Better Auth)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name"),
  // ... other fields
})

// Organization tables
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$default(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // ... other fields
})

// Host management tables
export const hosts = sqliteTable("hosts", {
  id: text("id").primaryKey().$default(() => createId()),
  organizationId: text("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  host: text("host").notNull(),
  // ... other fields
})
```

## Database Operations

### Select Operations

```typescript
import { db } from '@/lib/db'
import { eq, and, or, desc } from 'drizzle-orm'
import { organizations, users } from '@/lib/db/schema'

// Get all organizations for a user
const userOrgs = await db.query.organizationMembers.findMany({
  where: eq(organizationMembers.userId, userId),
  with: {
    organization: true,
  },
})

// Get hosts with organization data
const hosts = await db
  .select({
    id: hosts.id,
    name: hosts.name,
    organization: {
      name: organizations.name,
    },
  })
  .from(hosts)
  .leftJoin(organizations, eq(organizations.id, hosts.organizationId))
  .where(eq(hosts.organizationId, orgId))
```

### Insert Operations

```typescript
// Create new organization
const [newOrg] = await db
  .insert(organizations)
  .values({
    name: "My Company",
    slug: "my-company",
    description: "ClickHouse monitoring",
  })
  .returning()

// Add user to organization
await db.insert(organizationMembers).values({
  organizationId: newOrg.id,
  userId: userId,
  role: "owner",
})
```

### Update Operations

```typescript
// Update host
const [updatedHost] = await db
  .update(hosts)
  .set({
    name: "Updated Name",
    description: "Updated description",
  })
  .where(eq(hosts.id, hostId))
  .returning()
```

### Delete Operations

```typescript
// Delete host
await db.delete(hosts).where(eq(hosts.id, hostId))

// Cascade delete will automatically clean up related records
```

## Query Patterns

### Complex Queries with Joins

```typescript
// Get organization members with user details
const members = await db
  .select({
    id: organizationMembers.id,
    role: organizationMembers.role,
    user: {
      id: users.id,
      email: users.email,
      name: users.name,
    },
  })
  .from(organizationMembers)
  .leftJoin(users, eq(users.id, organizationMembers.userId))
  .where(eq(organizationMembers.organizationId, orgId))
```

### Pagination

```typescript
const page = 1
const limit = 10
const offset = (page - 1) * limit

const paginatedResults = await db
  .select()
  .from(organizations)
  .limit(limit)
  .offset(offset)
```

### Aggregations

```typescript
// Count members per organization
const orgsWithCounts = await db
  .select({
    id: organizations.id,
    name: organizations.name,
    memberCount: db.$count(
      organizationMembers,
      eq(organizationMembers.organizationId, organizations.id)
    ),
  })
  .from(organizations)
```

## Database Migrations

### Generating Migrations

```bash
# Generate migration files
bun run db:generate

# Output: drizzle/0000_initial_schema.sql
```

### Running Migrations

```bash
# Apply migrations
bun run db:migrate

# Rollback last migration
bun run db:rollback
```

### Manual Migration

```bash
# Create migration directory if needed
mkdir -p drizzle

# Run specific migration
npx drizzle-kit migrate
```

## Type Safety

### Schema Types

Drizzle generates TypeScript types from your schema:

```typescript
import type { organizations, users, hosts } from './lib/db/schema'

// These types are automatically generated and type-safe
type Organization = typeof organizations.$inferSelect
type NewOrganization = typeof organizations.$inferInsert
```

### Query Return Types

```typescript
// Return types are inferred automatically
const result = await db.query.users.findMany({
  where: eq(users.email, 'test@example.com'),
  columns: {
    id: true,
    email: true,
    name: true,
  },
})

// TypeScript knows the exact shape of result
type UserResult = typeof result
// { id: string; email: string; name: string | null }[]
```

## Error Handling

### Database Errors

```typescript
try {
  const result = await db.insert(users).values(userData)
} catch (error) {
  if (error instanceof Error) {
    console.error('Database error:', error.message)

    // Handle specific error types
    if (error.message.includes('UNIQUE constraint')) {
      // Handle duplicate email
    }
  }
}
```

### Transaction Support

```typescript
import { db } from '@/lib/db'

await db.transaction(async (tx) => {
  // All operations in this transaction will be atomic
  const [org] = await tx.insert(organizations).values(orgData).returning()
  await tx.insert(organizationMembers).values({
    organizationId: org.id,
    userId: userId,
    role: 'owner',
  })
})
```

## Performance Considerations

### Indexes

```typescript
// Add indexes for frequently queried columns
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  // ... other fields
}, (t) => ({
  slugIndex: unique().on(t.slug),
}))
```

### Query Optimization

```typescript
// Select only needed columns
const users = await db
  .select({ id: users.id, email: users.email })
  .from(users)

// Use joins instead of multiple queries
const data = await db
  .select()
  .from(users)
  .leftJoin(organizations, eq(organizations.id, users.organizationId))
```

## Testing

### Unit Tests

```typescript
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

test('should create organization', async () => {
  const [org] = await db.insert(organizations).values({
    name: 'Test Org',
    slug: 'test-org',
  }).returning()

  expect(org.name).toBe('Test Org')
})
```

### Integration Tests

```typescript
// Test database connection
test('should connect to database', async () => {
  const result = await db.select({ count: sql`count(*)` }).from(users)
  expect(result[0].count).toBeDefined()
})
```

## Troubleshooting

### Common Issues

1. **Type Mismatch**
   - Check schema definitions match database
   - Regenerate types after schema changes

2. **Migration Errors**
   - Clear migration files and regenerate
   - Check for foreign key constraints

3. **Performance Issues**
   - Add appropriate indexes
   - Optimize query joins

### Debug Mode

```typescript
// Enable query logging
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'

const db = drizzle(sqlite, {
  schema,
  logger: console.log, // Log all queries
})
```