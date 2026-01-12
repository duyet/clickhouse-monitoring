# Drizzle ORM Setup

This document covers the Drizzle ORM configuration and usage in the ClickHouse monitoring application.

## Overview

The application uses [Drizzle ORM](https://orm.drizzle.team/) as the primary database ORM. Drizzle provides type-safe database operations, migrations, and a clean TypeScript API.

## Configuration

### Database Connection

The database connection is configured in `lib/db/index.ts`:

```typescript
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

// Initialize database connection
const sqlite = new Database(process.env.DATABASE_URL || "./data/app.db")
export const db = drizzle(sqlite, { schema })
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `./data/app.db` |
| `DB_DIALECT` | Database dialect (sqlite, postgresql, d1) | `sqlite` |

## Schema Definition

### Tables

The schema is defined in `lib/db/schema.ts` using Drizzle's table builders:

```typescript
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // ... other columns
})
```

### Relations

Drizzle supports defining relationships between tables:

```typescript
export const organizationMembers = sqliteTable("organization_members", {
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  userId: text("user_id").notNull().references(() => users.id),
  // ... other columns
}, (table) => ({
  compoundPrimaryKey: primaryKey({
    columns: [table.organizationId, table.userId],
  }),
}))
```

## Migrations

### Creating Migrations

Generate migration files from schema changes:

```bash
bun run db:generate
```

This creates migration files in `lib/db/migrations/` with:
- Timestamp-based naming
- SQL statements for schema changes
- Rollback functionality

### Running Migrations

Apply migrations to the database:

```bash
bun run db:migrate
```

### Migration Commands

| Command | Description |
|---------|-------------|
| `bun run db:generate` | Generate new migration |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:push` | Push changes directly (dev only) |
| `bun run db:studio` | Open Drizzle Studio |

## Query Operations

### Select Queries

```typescript
// Get all users
const users = await db.select().from(users)

// Get users with conditions
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.isActive, true))
```

### Insert Queries

```typescript
// Insert single record
const newUser = await db
  .insert(users)
  .values({ name: "John", email: "john@example.com" })
  .returning()

// Insert multiple records
await db
  .insert(users)
  .values([
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" }
  ])
```

### Update Queries

```typescript
// Update records
const updated = await db
  .update(users)
  .set({ name: "Jonathan" })
  .where(eq(users.id, "user-id"))
  .returning()
```

### Delete Queries

```typescript
// Delete records
const deleted = await db
  .delete(users)
  .where(eq(users.id, "user-id"))
  .returning()
```

### Joins

```typescript
// Get users with their organizations
const userOrgs = await db
  .select({
    userId: users.id,
    userName: users.name,
    orgName: organizations.name,
  })
  .from(users)
  .leftJoin(
    organizationMembers,
    eq(users.id, organizationMembers.userId)
  )
  .leftJoin(
    organizations,
    eq(organizationMembers.organizationId, organizations.id)
  )
```

## Transactions

```typescript
await db.transaction(async (tx) => {
  // Multiple operations in a single transaction
  const user = await tx
    .insert(users)
    .values({ name: "John", email: "john@example.com" })
    .returning()

  await tx
    .insert(organizationMembers)
    .values({
      organizationId: "org-id",
      userId: user[0].id,
      role: "member"
    })
})
```

## Advanced Features

### Batch Operations

```typescript
// Batch insert
await db.batch([
  db.insert(users).values({ name: "User 1" }),
  db.insert(users).values({ name: "User 2" }),
  db.insert(users).values({ name: "User 3" }),
])
```

### Raw Queries

```typescript
// Execute raw SQL
const result = await db.execute(sql`
  SELECT COUNT(*) as count FROM users WHERE created_at > ${sql.date(new Date('2024-01-01'))}
`)
```

### Subqueries

```typescript
const usersWithRecentActivity = await db
  .select()
  .from(users)
  .where(
    exists(
      db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, users.id),
            gt(sessions.lastAccessed, new Date(Date.now() - 86400000))
          )
        )
    )
  )
```

## Type Safety

### Infer Types

Drizzle provides type inference from your schema:

```typescript
// Type is inferred from schema
type User = typeof users.$inferSelect

// For inserts (optional fields)
type NewUser = typeof users.$inferInsert
```

### Using Inferred Types

```typescript
// Type-safe query result
const user: User = await db
  .select()
  .from(users)
  .where(eq(users.id, "id"))
  .limit(1)
  .then(rows => rows[0])
```

## Error Handling

### Database Errors

```typescript
try {
  await db.insert(users).values({ email: "invalid" })
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error("Database error:", error.message)
    // Handle specific error codes
    if (error.code === "23505") {
      // Unique constraint violation
    }
  }
}
```

### Validation

```typescript
// Validate before insert
if (!user.name || user.name.length < 2) {
  throw new Error("Name must be at least 2 characters")
}
```

## Performance

### Indexes

```typescript
// Add index to schema
export const users = sqliteTable("users", {
  // ... columns
}, (table) => ({
  emailIndex: index("email_idx").on(table.email),
}))
```

### Query Optimization

```typescript
// Select only needed columns
const userNames = await db
  .select({ id: users.id, name: users.name })
  .from(users)

// Use pagination
const paginated = await db
  .select()
  .from(users)
  .limit(10)
  .offset(20)
```

## Debugging

### Query Logging

Enable query logging in development:

```typescript
// In lib/db/index.ts
if (process.env.NODE_ENV === "development") {
  db.$config.logger = {
    logQuery(query) {
      console.log("Query:", query.sql, query.params)
    }
  }
}
```

### Drizzle Studio

Open the visual database management tool:

```bash
bun run db:studio
```

This provides:
- Schema visualization
- Query execution
- Data browsing
- Migration management

## Migration Strategy

### Version Control

1. All migrations are committed to Git
2. Use descriptive names for migration files
3. Include rollback statements in all migrations

### Production Migrations

1. Test migrations in staging environment first
2. Backup database before applying migrations
3. Monitor migration execution time
4. Have rollback plan ready

### Zero Downtime Migrations

For production environments:
- Use schema drift detection
- Test migrations on replica
- Use feature flags for new schema features
- Monitor application performance during migrations

## Troubleshooting

### Common Issues

1. **Migration fails**
   - Check database permissions
   - Verify connection string
   - Ensure no conflicting locks

2. **Type errors**
   - Regenerate types after schema changes
   - Check TypeScript configuration
   - Verify `tsconfig.json` includes type checking

3. **Performance issues**
   - Add appropriate indexes
   - Optimize query patterns
   - Use connection pooling

### Debug Commands

```bash
# Check current schema
bun run db:studio

# View migration history
sqlite3 data/app.db ".tables"

# Check for pending migrations
ls lib/db/migrations
```