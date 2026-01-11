# Database Setup Guide

This guide explains how to set up the database for the ClickHouse monitoring application with authentication and organization management.

## Supported Databases

The application supports multiple database backends through Drizzle ORM:

- **SQLite** (default) - Simple setup, good for development and small deployments
- **PostgreSQL** - Production-ready with better performance and scalability
- **Cloudflare D1** - For Cloudflare Workers deployments

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL="file:./data/app.db"
DB_DIALECT="sqlite"

# Better Auth Configuration
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"

# Optional: OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: Encryption (for host credentials)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# ClickHouse Configuration (existing)
CLICKHOUSE_HOST="localhost"
CLICKHOUSE_USER="default"
CLICKHOUSE_PASSWORD=""
```

### 3. Run Database Migration

```bash
# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate

# Or use Drizzle CLI directly
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Database Configuration Details

### SQLite Setup

```env
DATABASE_URL="file:./data/app.db"
DB_DIALECT="sqlite"
```

SQLite is the default option and works out of the box. The database file will be created automatically.

### PostgreSQL Setup

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
DB_DIALECT="postgres"
```

1. Install PostgreSQL
2. Create a database: `createdb clickhouse-monitoring`
3. Update your `.env.local` with the connection string

### Cloudflare D1 Setup

```env
DATABASE_URL="file:./data/app.db"
DB_DIALECT="sqlite"
```

For Cloudflare D1 deployment, you'll need to:
1. Create your D1 database
2. Import the SQLite migration file
3. Configure Cloudflare Workers to use D1

## Migration System

The application uses Drizzle ORM for database migrations:

### Migration Files

- Location: `lib/db/migrations/`
- Format: `0000_description.sql`
- Auto-generated using `drizzle-kit generate`

### Migration Commands

```bash
# Generate new migration
bun run db:generate

# Run pending migrations
bun run db:migrate

# Create new migration file
npx drizzle-kit generate

# Push schema changes (development only)
npx drizzle-kit push
```

### Manual Migration

For production environments, it's recommended to:

1. Generate migration files: `bun run db:generate`
2. Review the SQL file: `lib/db/migrations/`
3. Run the migration manually with your database client

## Database Schema Overview

### Authentication Tables
- `users` - User accounts and profile information
- `sessions` - User sessions with expiration
- `accounts` - OAuth provider accounts (GitHub, Google)
- `tokens` - Verification and reset tokens

### Organization Tables
- `organizations` - Organization profiles
- `organization_members` - User-organization relationships
- `invitations` - Team invitations with tokens

### Host Management Tables
- `hosts` - ClickHouse host configurations (encrypted credentials)
- `audit_log` - Security and activity audit trail

### Key Features
- **Encryption**: Host credentials are encrypted using AES-256-GCM
- **Multi-tenancy**: Organizations are isolated
- **Audit Logging**: All actions are logged with timestamps
- **Soft Deletes**: Implemented through flags where appropriate

## Security Considerations

### Encryption

Host credentials are encrypted using AES-256-GCM:

1. **Environment Variable**: Set `ENCRYPTION_KEY` to a 32+ character string
2. **Key Rotation**: Change the key to re-encrypt all credentials
3. **Salt**: Each encryption uses a unique salt

### Session Management

1. **JWT Tokens**: Sessions use signed JWT tokens
2. **Expiration**: Default 30 days with automatic refresh
3. **Secure Storage**: Encrypted and HttpOnly cookies

### Rate Limiting

Built-in rate limiting for auth endpoints:
- Login: 5 attempts per 15 minutes
- Registration: 1 attempt per hour
- General API: 100 requests per 15 minutes

## Development Setup

### SQLite (Recommended for Development)

```bash
# Default setup - just run
bun run dev
```

### PostgreSQL Development

```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Create database and user
createdb clickhouse-monitoring-dev
createuser -P clickhouse-monitoring-user

# Update .env.local with PostgreSQL connection
DATABASE_URL="postgresql://clickhouse-monitoring-user:password@localhost:5432/clickhouse-monitoring-dev"
DB_DIALECT="postgres"

# Run migrations
bun run db:migrate
```

## Production Deployment

### PostgreSQL Production

```bash
# Use PostgreSQL for production
DATABASE_URL="postgresql://user:pass@prod-host:5432/clickhouse-monitoring"
DB_DIALECT="postgres"

# Run migrations on startup
bun run db:migrate
```

### Cloudflare Workers (D1)

```bash
# Use SQLite for Cloudflare Workers
DATABASE_URL="file:./data/app.db"
DB_DIALECT="sqlite"

# Deploy to Cloudflare
bun run cf:deploy
```

## Troubleshooting

### Common Issues

1. **Migration fails**: Check database permissions and connection string
2. **Encryption errors**: Ensure `ENCRYPTION_KEY` is set and valid
3. **Schema sync issues**: Run `bun run db:reset` to reset development database

### Debug Commands

```bash
# Check database connection
bun run db:check

# Reset development database
bun run db:reset

# View current schema
bun run db:status
```

## Backup and Recovery

### SQLite Backup

```bash
# Create backup
cp data/app.db data/app.db.backup

# Restore from backup
cp data/app.db.backup data/app.db
```

### PostgreSQL Backup

```bash
# Create backup
pg_dump clickhouse-monitoring > backup.sql

# Restore from backup
psql clickhouse-monitoring < backup.sql
```

### Backup Strategy

1. **Daily automated backups**
2. **Off-site storage**
3. **Regular testing of restore process**
4. **Encrypted backups for sensitive data`