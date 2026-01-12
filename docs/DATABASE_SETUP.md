# Database Setup

This ClickHouse monitoring application uses a local SQLite database by default, with support for PostgreSQL and Cloudflare D1.

## Default Setup (SQLite)

### Initial Setup

1. Install dependencies:
```bash
bun install
```

2. Run the initial migration:
```bash
bun run db:migrate
```

3. Start the application:
```bash
bun run dev
```

### Database Configuration

The application uses Better Auth with Drizzle ORM. The database connection is configured in `lib/db/index.ts`.

**Default database location:** `./data/app.db`

### Database Schema

The application uses the following tables:

- `users` - User accounts and profile information
- `accounts` - OAuth provider accounts
- `sessions` - User sessions
- `verification_tokens` - Email verification tokens
- `organizations` - Multi-tenant organizations
- `organization_members` - Organization membership with roles
- `hosts` - Encrypted ClickHouse host configurations
- `audit_logs` - Security and audit logging

## Alternative Database Backends

### PostgreSQL

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE clickhouse_monitor;
```

2. Set environment variables:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/clickhouse_monitor
DB_DIALECT=postgresql
```

3. Install additional dependencies:
```bash
bun add drizzle-orm drizzle-kit postgres
```

4. Update the database configuration in `lib/db/index.ts` to use PostgreSQL.

### Cloudflare D1

1. Create a D1 database:
```bash
npx wrangler d1 create clickhouse-monitor
```

2. Set environment variables:
```env
DATABASE_URL=cloudflare-d1://DATABASE_ID
DB_DIALECT=d1
```

3. Install additional dependencies:
```bash
bun add drizzle-orm drizzle-kit @cloudflare/d1-drizzle-driver
```

4. Update the database configuration in `lib/db/index.ts` to use D1.

## Database Migrations

### Creating Migrations

```bash
bun run db:generate
```

### Running Migrations

```bash
bun run db:migrate
```

### Resetting Database

```bash
bun run db:reset
```

**Warning:** This will delete all data!

## Security Considerations

### Encryption

- Host credentials are encrypted using AES-256-GCM
- The encryption key is stored in `ENCRYPTION_KEY` environment variable
- Never commit the encryption key to version control

### Audit Logging

- All security events are logged
- Logs include user actions, IP addresses, and user agents
- Logs are stored in the `audit_logs` table

### Session Management

- Sessions use secure, HTTP-only cookies
- Session tokens are automatically refreshed
- Sessions expire after 30 days of inactivity

## Backup and Recovery

### SQLite Backup

```bash
# Create backup
sqlite3 data/app.db ".backup backup.db"

# Restore from backup
sqlite3 data/app.db < backup.db
```

### PostgreSQL Backup

```bash
# Create dump
pg_dump clickhouse_monitor > backup.sql

# Restore from dump
psql clickhouse_monitor < backup.sql
```

## Monitoring

### Database Health

The application includes health checks for:
- Database connectivity
- Migration status
- Encryption key validation

### Performance

- Connection pooling is implemented for better performance
- Queries are optimized for monitoring workloads
- Caching is used for frequently accessed data

## Troubleshooting

### Common Issues

1. **Migration fails**
   - Check database permissions
   - Ensure database is accessible
   - Verify connection string

2. **Encryption errors**
   - Verify `ENCRYPTION_KEY` is set
   - Ensure key is at least 64 characters
   - Check key format

3. **Session issues**
   - Verify `BETTER_AUTH_SECRET` is set
   - Check cookie domain configuration
   - Ensure HTTPS in production

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will enable detailed logging for database operations and authentication.