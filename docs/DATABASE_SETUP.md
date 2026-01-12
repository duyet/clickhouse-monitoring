# Database Setup

This ClickHouse monitoring dashboard supports multiple database backends for storing authentication and organization data.

## Supported Databases

### SQLite (Default)
- **File**: `./data/app.db`
- **Configuration**: `DB_DIALECT=sqlite`
- **Setup**: Automatic on first run
- **Best for**: Development and small deployments

### PostgreSQL
- **URL**: `postgresql://user:password@localhost:5432/dbname`
- **Configuration**: `DB_DIALECT=postgres` and `DATABASE_URL=postgresql://...`
- **Best for**: Production deployments

### Cloudflare D1
- **URL**: `wrangler d1 execute DATABASE --file=schema.sql`
- **Configuration**: `DB_DIALECT=postgres` and `DATABASE_URL=file:./data/d1.sqlite`
- **Best for**: Cloudflare Workers deployment

## Environment Variables

Required environment variables:

```env
# Database Configuration
DB_DIALECT=sqlite                    # or "postgres"
DATABASE_URL=file:./data/app.db      # Database connection URL

# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-min-32-chars

# Encryption
ENCRYPTION_KEY=your-encryption-key-min-32-chars
```

## Setup Instructions

### 1. Create Database (if using PostgreSQL)

```sql
CREATE DATABASE clickhouse_monitor;
```

### 2. Run Database Migration

```bash
# Generate migration files
bun run db:generate

# Apply migration
bun run db:migrate
```

### 3. Initialize Database Tables

The application will automatically create the necessary tables on first startup when using SQLite. For PostgreSQL, the migration will handle table creation.

## Database Schema

The application uses the following main tables:

### Authentication Tables (Better Auth)
- `users` - User accounts
- `sessions` - User sessions
- `accounts` - OAuth account links
- `verification_tokens` - Email verification tokens

### Application Tables
- `organizations` - Organization definitions
- `organization_members` - User-organization relationships
- `hosts` - ClickHouse host configurations
- `audit_logs` - Security and audit logging

## Security Considerations

1. **Encryption**: All database connections use secure protocols
2. **Passwords**: User passwords are hashed using bcrypt
3. **Session Tokens**: Stored securely with expiration
4. **Audit Logging**: All sensitive actions are logged

## Troubleshooting

### Database Connection Issues

1. Check database URL format
2. Verify database service is running
3. Ensure proper permissions

### Migration Issues

1. Clear existing migration files: `rm -rf drizzle/`
2. Regenerate: `bun run db:generate`
3. Apply: `bun run db:migrate`

## Backup Strategy

### SQLite
- Copy the database file: `cp ./data/app.db ./backup/app-$(date +%Y%m%d).db`

### PostgreSQL
```sql
-- Full database dump
pg_dump clickhouse_monitor > backup.sql

-- Structure only
pg_dump -s clickhouse_monitor > structure.sql
```