# Drizzle ORM Setup for ClickHouse Monitor SSO

This guide documents the Drizzle ORM configuration for the ClickHouse Monitor SSO/authentication system.

## Overview

The project supports 3 database types with shared schemas:
- **SQLite** (default for Docker and local development)
- **PostgreSQL** (recommended for production)
- **D1** (Cloudflare Workers)
- **LibSQL/Turso** (serverless SQLite)

## Architecture

### Schema Files
- `lib/db/schema/auth.ts` - SQLite schema (default, D1-compatible)
- `lib/db/schema/auth.postgres.ts` - PostgreSQL schema variants

### Configuration
- `lib/auth/config.ts` - Database adapter detection and configuration
- `lib/db/index.ts` - Database client factory with lazy loading
- `lib/db/migrate.ts` - Auto-migration runner

### Migrations
- `lib/db/migrations/` - SQL migration files
- `drizzle.config.ts` - Drizzle Kit configuration

## Environment Configuration

### SQLite (Local Development - Default)
```bash
DATABASE_URL=sqlite:./clickhouse-monitor.db
AUTO_MIGRATE=true
```

### PostgreSQL (Production)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/clickhouse-monitor
AUTO_MIGRATE=true
```

### LibSQL (Turso)
```bash
DATABASE_URL=libsql://your-database.turso.io?authToken=your-token
AUTO_MIGRATE=true
```

### D1 (Cloudflare Workers)
Use wrangler.toml:
```toml
[[d1_databases]]
binding = "DB"
database_name = "clickhouse-monitor"
database_id = "your-db-id"
```

## Usage

### In Application Code

```typescript
import { getDb } from '@/lib/db'
import { organization, member } from '@/lib/db/schema'

// Get database instance
const db = await getDb()

// Query
const orgs = await db.select().from(organization)

// Insert
await db.insert(organization).values({
  id: 'org-1',
  name: 'My Organization',
  slug: 'my-org',
  createdAt: new Date(),
})
```

### Database Adapter Detection

```typescript
import { detectDatabaseAdapter, isDatabaseConfigured } from '@/lib/auth/config'

const adapter = detectDatabaseAdapter() // 'sqlite', 'postgres', 'd1', 'libsql', or 'none'
const isConfigured = isDatabaseConfigured()
```

## Commands

### Generate Migrations
```bash
bun run db:generate
# Compares schema files with migrations and generates new migration files
# By default generates for SQLite dialect
# For PostgreSQL: set DATABASE_URL to postgres:// before running
```

### Run Migrations
```bash
bun run db:migrate
# Auto-runs on startup if AUTO_MIGRATE=true
# Can also be run manually anytime
```

### Open Drizzle Studio
```bash
bun run db:studio
# Web UI for browsing and editing database
```

## Schema Overview

### organization
Primary table for teams/workspaces.

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Unique identifier |
| name | text | Organization name |
| slug | text | URL-friendly identifier (unique) |
| logo | text | Logo URL |
| createdAt | timestamp | Auto-set on insert |
| updatedAt | timestamp | Auto-updated on modify |

### member
Junction table linking users to organizations with roles.

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Unique identifier |
| organizationId | text (FK) | References organization.id |
| userId | text | External user ID (from auth system) |
| role | text | 'owner', 'admin', 'member', 'viewer' |
| createdAt | timestamp | Auto-set on insert |

### clickhouseHost
Stores ClickHouse connection configurations per organization.

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Unique identifier |
| organizationId | text (FK) | References organization.id |
| name | text | Host name/label |
| host | text | Hostname/IP address |
| username | text | ClickHouse username |
| passwordEncrypted | text | Encrypted password |
| timezone | text | Optional timezone |
| maxExecutionTime | int | Query timeout in seconds (default: 60) |
| isActive | boolean | Soft enable/disable flag |
| sortOrder | int | Display order |
| createdAt | timestamp | Auto-set on insert |
| createdBy | text | User ID who created |
| updatedAt | timestamp | Auto-updated on modify |

### auditLog
Records all significant actions for compliance.

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Unique identifier |
| organizationId | text | Optional organization context |
| userId | text | User who performed action |
| action | text | Action type (e.g., 'create', 'delete') |
| resourceType | text | Resource being acted upon |
| resourceId | text | ID of resource |
| metadata | text | JSON string of additional data |
| ipAddress | text | Source IP address |
| userAgent | text | Browser/client user agent |
| createdAt | timestamp | Auto-set on insert |

## Database Adapter Selection Logic

1. Check `DATABASE_URL` environment variable
2. Parse URL scheme:
   - `postgresql://` or `postgres://` → PostgreSQL
   - `d1://` or `D1_DATABASE` env → D1
   - `libsql://` → LibSQL
   - `sqlite://`, `file://`, or anything else → SQLite (default)
3. If no `DATABASE_URL` → `none` (no database)

## Best Practices

### 1. Always Use Type Safety
```typescript
import type { NewOrganization } from '@/lib/db/schema'

const org: NewOrganization = {
  id: 'org-1',
  name: 'My Org',
  slug: 'my-org',
  createdAt: new Date(),
}
```

### 2. Handle Database Adapter Variations
```typescript
import { detectDatabaseAdapter } from '@/lib/auth/config'

const adapter = detectDatabaseAdapter()
if (adapter === 'postgres') {
  // Use PostgreSQL-specific features
} else if (adapter === 'sqlite') {
  // Use SQLite features
}
```

### 3. Idempotent Migrations
All migrations should be safe to run multiple times:
```sql
-- Good: Idempotent
CREATE TABLE IF NOT EXISTS "users" (...)
CREATE INDEX IF NOT EXISTS "idx_name" ON "users" (...)

-- Bad: Not idempotent
CREATE TABLE "users" (...)
```

### 4. Password Encryption
The `passwordEncrypted` field should store encrypted passwords:
```typescript
import crypto from 'crypto'

function encryptPassword(password: string): string {
  const key = process.env.DB_ENCRYPTION_KEY
  const cipher = crypto.createCipher('aes-256-cbc', key)
  return cipher.update(password, 'utf8', 'hex') + cipher.final('hex')
}
```

## Troubleshooting

### Migration Generation Issues

**Problem**: `drizzle-kit generate` fails with "no changes detected"
- Ensure schema files have been modified
- Check `drizzle.config.ts` points to correct schema directory

**Problem**: Wrong dialect in migrations
- Set `DATABASE_URL` correctly before running `db:generate`
- Or manually edit `drizzle.config.ts` dialect setting

### Connection Issues

**SQLite**: Database file permissions
```bash
# Ensure write permissions in current directory
chmod 644 clickhouse-monitor.db
```

**PostgreSQL**: Connection string format
```
postgresql://[user[:password]@][netloc][:port][/dbname]
```

**D1**: Requires wrangler authentication
```bash
wrangler login
wrangler d1 create clickhouse-monitor
```

### Auto-Migration Failures

Check logs and enable debug mode:
```bash
# Disable auto-migration for debugging
AUTO_MIGRATE=false bun run dev

# Run migration manually with verbose output
bun run db:migrate
```

## Performance Considerations

### Indexes
- Organization slug is indexed for lookups
- Audit logs indexed by organization and user for filtering
- Member queries use unique index on (organization_id, user_id)

### Caching
- Database connections are singleton (lazy-loaded, cached)
- Use application-level caching for frequently accessed data

### Query Optimization
```typescript
// ✓ Good: Load only needed columns
const hosts = await db
  .select({ id: clickhouseHost.id, name: clickhouseHost.name })
  .from(clickhouseHost)
  .where(eq(clickhouseHost.organizationId, orgId))

// ✗ Avoid: Select all columns
const hosts = await db
  .select()
  .from(clickhouseHost)
  .where(eq(clickhouseHost.organizationId, orgId))
```

## Migration Checklist

- [ ] Install dependencies: `bun install`
- [ ] Create `.env.local` with `DATABASE_URL`
- [ ] Run `bun run db:migrate` to initialize database
- [ ] Test database connection: `bun run db:studio`
- [ ] Verify schema in Drizzle Studio
- [ ] Test application authentication flow

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Drizzle Kit Guide](https://orm.drizzle.team/kit-docs/overview)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [LibSQL/Turso](https://turso.tech)
