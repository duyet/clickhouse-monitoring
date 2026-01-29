# Database Setup for ClickHouse Monitor SSO

Complete guide to setting up and using the Drizzle ORM database layer for ClickHouse Monitor's authentication and SSO system.

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment
```bash
# Copy the example and edit with your database
cp .env.local.example .env.local

# For development (SQLite):
echo "DATABASE_URL=sqlite:./clickhouse-monitor.db" >> .env.local

# For production (PostgreSQL):
echo "DATABASE_URL=postgresql://user:password@localhost:5432/clickhouse-monitor" >> .env.local
```

### 3. Run Migrations
```bash
# Auto-runs on startup, but you can run manually:
bun run db:migrate
```

### 4. Verify Setup
```bash
# Open Drizzle Studio to inspect database
bun run db:studio
```

## Directory Structure

```
lib/db/
├── schema/
│   ├── auth.ts                    # SQLite schema (default)
│   ├── auth.postgres.ts           # PostgreSQL schema variants
│   └── index.ts                   # Schema exports
├── repositories/
│   ├── organization.ts            # Organization data access
│   ├── member.ts                  # Member data access
│   ├── clickhouse-host.ts        # Host config data access
│   ├── audit-log.ts              # Audit trail data access
│   └── index.ts                   # Repository factory
├── migrations/
│   ├── 0001_initial_schema.sql   # SQLite initial migration
│   └── 0001_initial_schema_postgres.sql
├── index.ts                       # Database client factory
├── migrate.ts                     # Migration runner
├── utils.ts                       # Helper utilities
└── __tests__/
    └── setup.test.ts              # Integration tests

lib/auth/
└── config.ts                      # Adapter detection & config
```

## Database Adapters

### SQLite (Default - Local Development)
- Best for: Development, Docker, testing
- Setup: Automatic with `database.db` file
- Connection: `sqlite:./clickhouse-monitor.db`

```bash
DATABASE_URL=sqlite:./clickhouse-monitor.db
```

### PostgreSQL (Production)
- Best for: Production deployments
- Setup: Requires external PostgreSQL server
- Connection: `postgresql://user:password@host:port/dbname`

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/clickhouse-monitor
```

### LibSQL/Turso (Serverless)
- Best for: Edge deployments, serverless
- Setup: Create account at turso.tech
- Connection: `libsql://your-db.turso.io?authToken=token`

```bash
DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
```

### D1 (Cloudflare Workers)
- Best for: Cloudflare Workers deployment
- Setup: Configure in wrangler.toml
- Connection: Via Workers environment

```toml
[[d1_databases]]
binding = "DB"
database_name = "clickhouse-monitor"
database_id = "your-db-id"
```

## Schema Overview

### Tables

#### organization
```typescript
{
  id: string              // Unique ID (org_xxx)
  name: string            // Organization name
  slug: string            // URL-friendly slug (unique)
  logo?: string           // Logo URL
  createdAt: timestamp    // Auto-set
  updatedAt?: timestamp   // Auto-updated
}
```

#### member
```typescript
{
  id: string              // Unique ID (mem_xxx)
  organizationId: string  // FK to organization
  userId: string          // External user ID (from auth)
  role: enum              // 'owner' | 'admin' | 'member' | 'viewer'
  createdAt: timestamp    // Auto-set
}
```

#### clickhouseHost
```typescript
{
  id: string                  // Unique ID (host_xxx)
  organizationId: string      // FK to organization
  name: string                // Display name
  host: string                // Hostname/IP
  username: string            // ClickHouse user
  passwordEncrypted: string   // Encrypted password
  timezone?: string           // Optional timezone
  maxExecutionTime?: number   // Query timeout (default: 60s)
  isActive: boolean           // Soft enable/disable
  sortOrder: number           // Display order
  createdAt: timestamp        // Auto-set
  createdBy: string           // Creator user ID
  updatedAt?: timestamp       // Auto-updated
}
```

#### auditLog
```typescript
{
  id: string              // Unique ID (audit_xxx)
  organizationId?: string // Optional org context
  userId?: string         // Actor user ID
  action: string          // Action type
  resourceType: string    // Resource being acted upon
  resourceId?: string     // Resource ID
  metadata?: string       // JSON metadata
  ipAddress?: string      // Source IP
  userAgent?: string      // Client user agent
  createdAt: timestamp    // Auto-set
}
```

## API Usage

### Using Repositories (Recommended)

```typescript
import { getDb } from '@/lib/db'
import { Repositories } from '@/lib/db/repositories'

async function myController() {
  const db = await getDb()
  const repos = new Repositories(db)

  // Create organization
  const org = await repos.organization.create({
    name: 'My Team',
    slug: 'my-team',
    createdAt: new Date(),
  })

  // Add member
  const member = await repos.member.create({
    organizationId: org.id,
    userId: 'user-123',
    role: 'admin',
  })

  // Add ClickHouse host
  const host = await repos.clickhouseHost.create({
    organizationId: org.id,
    name: 'Production',
    host: 'clickhouse.example.com',
    username: 'default',
    passwordEncrypted: 'encrypted-password',
    createdBy: 'user-123',
  })

  // Log action
  await repos.auditLog.create({
    organizationId: org.id,
    userId: 'user-123',
    action: 'host:added',
    resourceType: 'clickhouse_host',
    resourceId: host.id,
    metadata: JSON.stringify({ hostName: host.name }),
  })
}
```

### Direct Database Access

```typescript
import { getDb } from '@/lib/db'
import { organization, member } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function directAccess() {
  const db = await getDb()

  // Query
  const orgs = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, 'my-team'))

  // Insert
  await db.insert(organization).values({
    id: 'org-123',
    name: 'My Team',
    slug: 'my-team',
    createdAt: new Date(),
  })

  // Update
  await db
    .update(organization)
    .set({ name: 'My Team Updated' })
    .where(eq(organization.id, 'org-123'))

  // Delete
  await db
    .delete(organization)
    .where(eq(organization.id, 'org-123'))
}
```

## Utilities

### ID Generation

```typescript
import {
  generateOrgId,
  generateMemberId,
  generateHostId,
  generateAuditId,
} from '@/lib/db/utils'

const orgId = generateOrgId()        // org_xxx
const memberId = generateMemberId()  // mem_xxx
const hostId = generateHostId()      // host_xxx
const auditId = generateAuditId()    // audit_xxx
```

### Slug Generation

```typescript
import { slugFromName, isValidSlug } from '@/lib/db/utils'

const slug = slugFromName('My Organization') // 'my-organization'
const valid = isValidSlug('my-org')          // true
```

### Role Management

```typescript
import { hasRole } from '@/lib/db/utils'

hasRole('owner', 'member')   // true (owner >= member)
hasRole('member', 'owner')   // false (member < owner)
hasRole('admin', 'admin')    // true (admin == admin)
```

### Audit Actions

```typescript
import { AUDIT_ACTIONS, createAuditMetadata } from '@/lib/db/utils'

const metadata = createAuditMetadata({
  hostName: 'Production',
  changes: { isActive: true },
})

await auditLog.create({
  action: AUDIT_ACTIONS.HOST_ADDED,
  metadata,
})
```

## Commands

### Development

```bash
# Start development server (auto-migrates)
bun run dev

# Run tests
bun run test
bun run test:query-config

# Type check
bun run type-check

# Lint and format
bun run lint
bun run fmt
```

### Database Management

```bash
# Generate migrations after schema changes
bun run db:generate

# Run migrations manually
bun run db:migrate

# Open Drizzle Studio (web UI)
bun run db:studio
```

### Environment Variables

```bash
# Required
DATABASE_URL                    # Database connection string
AUTO_MIGRATE=true              # Auto-run migrations on startup

# Optional (encryption)
DB_ENCRYPTION_KEY              # Key for password encryption
NODE_ENV                       # Environment (development/production)
```

## Examples

### Create Organization with Members

```typescript
import { getDb } from '@/lib/db'
import { Repositories } from '@/lib/db/repositories'
import { generateOrgId, slugFromName } from '@/lib/db/utils'

async function setupOrganization(name: string, ownerUserId: string) {
  const db = await getDb()
  const repos = new Repositories(db)

  // Create organization
  const org = await repos.organization.create({
    name,
    slug: slugFromName(name),
    createdAt: new Date(),
  })

  // Add owner as member
  await repos.member.create({
    organizationId: org.id,
    userId: ownerUserId,
    role: 'owner',
  })

  return org
}
```

### Get User's Organizations and Hosts

```typescript
import { createRepositories } from '@/lib/db/repositories'

async function getUserContext(userId: string) {
  const repos = await createRepositories()

  // Get all organizations for user
  const memberships = await repos.member.getByUser(userId)
  
  // Get hosts for first organization
  if (memberships.length > 0) {
    const orgId = memberships[0].organizationId
    const hosts = await repos.clickhouseHost.getByOrganization(orgId)
    return { memberships, hosts }
  }

  return { memberships, hosts: [] }
}
```

### Audit Trail

```typescript
import { createRepositories, AUDIT_ACTIONS } from '@/lib/db/repositories'

async function logHostUpdate(
  orgId: string,
  userId: string,
  hostId: string,
  changes: Record<string, unknown>
) {
  const repos = await createRepositories()

  await repos.auditLog.create({
    organizationId: orgId,
    userId,
    action: AUDIT_ACTIONS.HOST_UPDATED,
    resourceType: 'clickhouse_host',
    resourceId: hostId,
    metadata: JSON.stringify({ changes }),
  })
}
```

## Troubleshooting

### Database Not Found

```
Error: SQLITE_CANTOPEN: unable to open database file
```

Solution: Ensure directory exists and has write permissions:
```bash
mkdir -p ./data
touch ./data/clickhouse-monitor.db
chmod 666 ./data/clickhouse-monitor.db
```

### Migration Errors

```
Error: no such table: organization
```

Solution: Run migrations:
```bash
bun run db:migrate
```

### Type Errors in Repositories

Ensure types are imported correctly:
```typescript
import type { Organization, NewOrganization } from '@/lib/db/schema'
import type { Database } from 'drizzle-orm'
```

## Performance Tips

1. **Use Indexes**: Already defined for common queries (slug, org+user)
2. **Limit Results**: Always use pagination with limit/offset
3. **Cache Frequently Accessed Data**: Organizations, active hosts
4. **Batch Operations**: Use transactions for related inserts/updates
5. **Monitor Query Times**: Enable query logging in production

## Security Considerations

1. **Password Encryption**: Always encrypt passwords before storing
2. **SQL Injection**: Use parameterized queries (Drizzle handles this)
3. **Access Control**: Check user roles before data access
4. **Audit Trail**: Log all critical operations
5. **Environment Variables**: Never commit secrets to repository

## References

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [PostgreSQL](https://www.postgresql.org/docs)
- [LibSQL/Turso](https://turso.tech)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
