# Drizzle ORM Implementation Checklist

## Pre-Setup Verification
- [x] Dependencies installed (`drizzle-orm`, `drizzle-kit`, `better-sqlite3`, `postgres`)
- [x] Configuration files created (`drizzle.config.ts`, `.env.local.example`)
- [x] NPM scripts added (`db:generate`, `db:migrate`, `db:studio`)

## Database Schema
- [x] SQLite schema created (`lib/db/schema/auth.ts`)
- [x] PostgreSQL schema created (`lib/db/schema/auth.postgres.ts`)
- [x] 4 tables defined (organization, member, clickhouseHost, auditLog)
- [x] Type exports configured
- [x] Indexes and constraints defined

## Core Database Layer
- [x] Client factory (`lib/db/index.ts`)
- [x] Migration runner (`lib/db/migrate.ts`)
- [x] Utility functions (`lib/db/utils.ts`)
- [x] Auth configuration (`lib/auth/config.ts`)
- [x] Adapter detection implemented

## Repositories (Data Access)
- [x] Organization repository
- [x] Member repository
- [x] ClickHouse host repository
- [x] Audit log repository
- [x] Repository factory

## Migrations
- [x] SQLite migration created
- [x] PostgreSQL migration created
- [x] Migrations idempotent
- [x] Migration directory structure

## Testing & Validation
- [x] Integration tests written
- [x] Schema validation tests
- [x] Adapter detection tests
- [x] Utility function tests

## Documentation
- [x] Setup guide (`docs/DRIZZLE_ORM_SETUP.md`)
- [x] API usage guide (`docs/DATABASE_SETUP.md`)
- [x] Implementation summary (`DRIZZLE_SETUP_COMPLETE.md`)
- [x] Environment template (`.env.local.example`)

## Next Steps - Integration (In Progress)

### 1. API Route Setup
- [ ] Create `app/api/v1/organizations/` routes
- [ ] Create `app/api/v1/members/` routes
- [ ] Create `app/api/v1/hosts/` routes
- [ ] Create `app/api/v1/audit/` routes
- [ ] Add request validation with Zod

### 2. Authentication Integration
- [ ] Integrate Better Auth
- [ ] Setup JWT tokens
- [ ] Implement session management
- [ ] Add login/logout endpoints
- [ ] Create user context middleware

### 3. Authorization
- [ ] Create role-based middleware
- [ ] Add permission checks
- [ ] Implement organization context
- [ ] Add audit logging to middleware
- [ ] Create authorization utilities

### 4. Error Handling
- [ ] Create error response types
- [ ] Add error handling middleware
- [ ] Implement error logging
- [ ] Create error recovery strategies
- [ ] Add validation error responses

### 5. Testing
- [ ] Write repository unit tests
- [ ] Write API integration tests
- [ ] Write authentication tests
- [ ] Write authorization tests
- [ ] Setup test database

### 6. Production Hardening
- [ ] Replace XOR encryption with bcrypt/argon2
- [ ] Add database connection pooling
- [ ] Configure query timeouts
- [ ] Add rate limiting
- [ ] Setup monitoring/logging

## File Locations Reference

### Database Layer
```
lib/db/
├── index.ts                 → Database client factory
├── migrate.ts               → Migration runner
├── utils.ts                 → Utility functions
├── schema/
│   ├── auth.ts             → SQLite schema
│   ├── auth.postgres.ts    → PostgreSQL schema
│   └── index.ts            → Exports
├── repositories/
│   ├── index.ts            → Repository factory
│   ├── organization.ts     → Org CRUD
│   ├── member.ts           → Member CRUD
│   ├── clickhouse-host.ts  → Host CRUD
│   └── audit-log.ts        → Audit CRUD
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0001_initial_schema_postgres.sql
└── __tests__/
    └── setup.test.ts
```

### Auth Configuration
```
lib/auth/
└── config.ts               → Adapter detection
```

### Configuration
```
drizzle.config.ts           → Drizzle Kit config
.env.local.example          → Environment template
```

### Documentation
```
docs/
├── DRIZZLE_ORM_SETUP.md   → Detailed setup
└── DATABASE_SETUP.md      → Usage examples

DRIZZLE_SETUP_COMPLETE.md   → Summary
IMPLEMENTATION_CHECKLIST.md → This file
```

## Environment Configuration

### Development (SQLite)
```bash
DATABASE_URL=sqlite:./clickhouse-monitor.db
AUTO_MIGRATE=true
```

### Production (PostgreSQL)
```bash
DATABASE_URL=postgresql://user:password@host:port/db
AUTO_MIGRATE=false
DB_ENCRYPTION_KEY=your-secret-key
```

### Deployment (D1/Cloudflare)
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "clickhouse-monitor"
```

## Testing Commands

```bash
# Unit tests
bun run test lib/db/__tests__

# Type checking
bun run type-check

# Database inspection
bun run db:studio

# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate
```

## Common Tasks

### Add New Table
1. Update schema in `lib/db/schema/auth.ts`
2. Create repository in `lib/db/repositories/`
3. Generate migration: `bun run db:generate`
4. Review migration file
5. Run migration: `bun run db:migrate`
6. Test with Drizzle Studio: `bun run db:studio`

### Modify Existing Table
1. Update schema definition
2. Generate migration: `bun run db:generate`
3. Review the `.sql` file
4. Run migration: `bun run db:migrate`
5. Test changes

### Query Data
```typescript
import { getDb } from '@/lib/db'
import { Repositories } from '@/lib/db/repositories'

const repos = new Repositories(await getDb())
const orgs = await repos.organization.getAll(100, 0)
```

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` environment variable
- Verify database file exists (SQLite)
- Verify PostgreSQL server running (PostgreSQL)
- Check credentials (PostgreSQL)

### Migration Fails
- Run `bun run db:studio` to inspect database
- Check migration file syntax
- Review error logs from `bun run db:migrate`
- Ensure migrations are idempotent

### Type Errors
- Run `bun run type-check`
- Check schema type exports
- Verify repository method signatures
- Update type imports

## Performance Considerations

### Indexes Created
- `organization.slug` (unique)
- `member.organizationId + member.userId` (unique)
- `clickhouseHost.organizationId + clickhouseHost.name` (unique)
- `auditLog.organizationId + auditLog.createdAt`
- `auditLog.userId + auditLog.createdAt`

### Query Optimization
- Use pagination (limit/offset)
- Select specific columns when needed
- Use database indexes effectively
- Consider caching frequently accessed data

## Security Checklist

- [ ] Use bcrypt/argon2 for password encryption (not XOR)
- [ ] Validate all inputs with Zod
- [ ] Check user roles before operations
- [ ] Log all audit events
- [ ] Never expose database URLs in client code
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting on API endpoints
- [ ] Add CORS configuration
- [ ] Use HTTPS in production
- [ ] Implement database connection pooling

## Deployment Checklist

- [ ] Set environment variables in deployment
- [ ] Run migrations on startup: `bun run db:migrate`
- [ ] Verify database connectivity
- [ ] Check audit logs are being created
- [ ] Monitor error logs
- [ ] Setup backup strategy
- [ ] Configure monitoring/alerting

## Resources

- Drizzle ORM Docs: https://orm.drizzle.team
- Better SQLite3: https://github.com/WiseLibs/better-sqlite3
- PostgreSQL: https://www.postgresql.org/docs
- Turso/LibSQL: https://turso.tech
- Cloudflare D1: https://developers.cloudflare.com/d1

## Support

For questions or issues:
1. Check `docs/DATABASE_SETUP.md` for common patterns
2. Review test examples in `lib/db/__tests__/`
3. Open Drizzle Studio: `bun run db:studio`
4. Check migration files: `lib/db/migrations/`

---

**Status**: Setup complete, ready for API integration
**Last Updated**: 2026-01-11
**Version**: 1.0
