# Database Setup Guide

This guide explains how to set up the database for the ClickHouse monitoring application with authentication and organization support.

## Supported Database Adapters

The application supports multiple database adapters through Drizzle ORM:

- **SQLite** (Default) - Simple file-based database, good for development and small deployments
- **PostgreSQL** - Production-ready with advanced features
- **Cloudflare D1** - Serverless database for Cloudflare deployments

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Variables

Create a `.env.local` file with the required variables:

```env
# Authentication
BETTER_AUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (choose one adapter)
DATABASE_URL=sqlite:./sqlite.db
# OR for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# OR for Cloudflare D1:
# DATABASE_URL=cloudflare:account-id:database-name

# Encryption
CLICKHOUSE_ENCRYPTION_KEY=your-32-character-encryption-key

# ClickHouse (existing)
CLICKHOUSE_HOST=localhost,localhost2
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

### 3. Initialize Database

For SQLite (default):

```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Or push directly for development
bun run db:push
```

For PostgreSQL:

```bash
# Generate migrations
bun run db:generate

# Create database (if needed)
createdb clickhouse_monitor

# Run migrations
bun run db:migrate
```

For Cloudflare D1:

```bash
# Create database
wrangler d1 create clickhouse-monitor

# Update .env.local with the database binding
# DATABASE_URL=cloudflare:account-id:database-name

# Run migrations locally first with SQLite
bun run db:generate
bun run db:migrate

# Then push to D1
wrangler d1 execute clickhouse-monitor --file=./lib/db/migrations/
```

## Database Schema

The application uses the following main tables:

### Users
- User authentication and profile information
- Linked to OAuth accounts

### Organizations
- Multi-tenant organization support
- Settings and metadata storage

### OrganizationMembers
- Team member management with roles
- Role-based access control

### Hosts
- Encrypted ClickHouse host configurations
- AES-256-GCM encryption for credentials

### Sessions
- Better Auth session management
- Security tracking

### AuditLogs
- Security event logging
- Compliance tracking

### HostConnections
- Connection history and monitoring
- Performance metrics

## Environment Variables

### Required

- `BETTER_AUTH_SECRET` - Secret key for Better Auth (32+ characters)
- `CLICKHOUSE_ENCRYPTION_KEY` - Key for encrypting host credentials (32 characters)

### Optional

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth integration
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth integration
- `DATABASE_URL` - Database connection string
- `NODE_ENV` - Environment (development/production)

## Development

### Database Studio

View and manage your database:

```bash
bun run db:studio
```

### Reset Database

```bash
# Delete SQLite file
rm -f sqlite.db

# For PostgreSQL, drop the database
dropdb clickhouse_monitor
```

### Migrations

```bash
# Generate new migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Create migration from scratch
bun drizzle-kit generate:sqlite
```

## Production Deployment

### Security Considerations

1. **Encryption Key**: Store the `CLICKHOUSE_ENCRYPTION_KEY` securely (e.g., KMS, HashiCorp Vault)
2. **Database Connection**: Use SSL/TLS for PostgreSQL connections
3. **Environment Variables**: Never commit secrets to version control
4. **Backups**: Regular database backups are essential

### Cloudflare D1 Deployment

1. Create the D1 database:
```bash
wrangler d1 create clickhouse-monitor
```

2. Update `wrangler.toml` with the database binding:
```toml
[[d1_databases]]
binding = "DB"
database_name = "clickhouse-monitor"
database_id = "your-database-id"
```

3. Run migrations:
```bash
# Generate migrations locally
bun run db:generate

# Push to D1
wrangler d1 execute clickhouse-monitor --file=./lib/db/migrations/
```

### PostgreSQL Deployment

1. Create database and user:
```sql
CREATE DATABASE clickhouse_monitor;
CREATE USER clickhouse_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE clickhouse_monitor TO clickhouse_user;
```

2. Update `.env.local`:
```env
DATABASE_URL=postgresql://clickhouse_user:secure-password@localhost:5432/clickhouse_monitor
```

3. Run migrations:
```bash
bun run db:migrate
```

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure all dependencies are installed and database permissions are correct
2. **Connection Issues**: Check DATABASE_URL format and network connectivity
3. **Encryption Errors**: Verify CLICKHOUSE_ENCRYPTION_KEY is set correctly

### Debug Mode

Enable debug logging:

```bash
DEBUG=drizzle:* bun run dev
```

## Next Steps

After setting up the database:

1. Configure OAuth providers in your environment
2. Set up the first organization and host
3. Configure environment-specific settings
4. Set up monitoring and logging

For more information, see:
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Better Auth Documentation](https://better-auth.com/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)