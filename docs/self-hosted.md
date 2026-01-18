# Self-Hosted Configuration

This guide covers deploying ClickHouse Monitor on your own infrastructure.

## Quick Start (No Authentication)

The simplest setup - no auth, just monitoring:

```bash
# Using Docker
docker run -d \
  -p 3000:3000 \
  -e CLICKHOUSE_HOST=http://your-clickhouse:8123 \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD=your-password \
  ghcr.io/duyet/clickhouse-monitor:latest

# Using Docker Compose (from repo root)
cp .env.example .env
# Edit .env with your ClickHouse credentials
docker compose up -d
```

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLICKHOUSE_HOST` | Yes | - | Comma-separated ClickHouse URLs |
| `CLICKHOUSE_USER` | Yes | - | Comma-separated usernames |
| `CLICKHOUSE_PASSWORD` | Yes | - | Comma-separated passwords |
| `CLICKHOUSE_NAME` | No | - | Custom display names for hosts |
| `DEPLOYMENT_MODE` | No | `self-hosted` | `self-hosted` or `cloud` |
| `DATABASE_URL` | No | - | Database for auth (Postgres/SQLite/D1) |
| `AUTH_SECRET` | No | - | Secret for session encryption |
| `ENV_HOSTS_VISIBILITY` | No | `all` | Who sees env hosts: `all`, `guest`, `none` |
| `AUTO_MIGRATE` | No | `true` | Run database migrations on startup |

### Deployment Modes

#### `DEPLOYMENT_MODE=self-hosted` (Default)
- No authentication by default
- Add DATABASE_URL + OAuth to enable optional SSO
- All authenticated users share the same database hosts
- Flexible host visibility via `ENV_HOSTS_VISIBILITY`

#### `DEPLOYMENT_MODE=cloud`
- Full multi-tenant mode
- Guests see env hosts only
- Authenticated users see ONLY their organization's hosts
- Users must add their own hosts after login

## Adding Authentication

### Step 1: Choose a Database

**SQLite (Default, recommended for getting started)**
```bash
DATABASE_URL=file:./data/auth.db
```

**Postgres (Recommended for production)**
```bash
DATABASE_URL=postgres://user:pass@localhost:5432/clickhouse_monitor
```

**Cloudflare D1 (Recommended for Cloudflare Workers)**
```bash
# Set via Cloudflare Dashboard or wrangler secret
DATABASE_URL is bound automatically via AUTH_DB binding
```

### Step 2: Configure OAuth Providers

#### GitHub
1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `https://your-domain.com/api/auth/callback/github`
4. Add to environment:
   ```bash
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

#### Google
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
4. Add to environment:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### GitHub Enterprise (Optional)
1. Go to GitHub Enterprise Settings → OAuth Apps (at enterprise level)
2. Create new OAuth App
3. Set callback URL: `https://your-domain.com/api/auth/callback/github-enterprise`
4. Add to environment:
   ```bash
   GITHUB_ENTERPRISE_CLIENT_ID=your-client-id
   GITHUB_ENTERPRISE_CLIENT_SECRET=your-client-secret
   GITHUB_ENTERPRISE_URL=https://github.enterprise.com
   ```

### Step 3: Set Auth Secret

Generate a secure random secret:
```bash
openssl rand -base64 32
# or
head -c 32 /dev/urandom | base64
```

Add to environment:
```bash
AUTH_SECRET=your-generated-secret
```

## Host Visibility Options

Control which users see environment-configured hosts:

| `ENV_HOSTS_VISIBILITY` | Guest Users | Authenticated Users |
|------------------------|-------------|---------------------|
| `all` (default) | See env hosts | See env hosts + DB hosts |
| `guest` | See env hosts | See only DB hosts |
| `none` | No access | See only DB hosts |

## Example Configurations

### Internal Dashboard (No Auth)
```bash
DEPLOYMENT_MODE=self-hosted
CLICKHOUSE_HOST=http://prod-ch:8123,http://staging-ch:8123
CLICKHOUSE_USER=readonly
CLICKHOUSE_PASSWORD=secret
CLICKHOUSE_NAME=Production,Staging
```

### Team Dashboard with SQLite + SSO
```bash
DEPLOYMENT_MODE=self-hosted
CLICKHOUSE_HOST=http://prod-ch:8123
CLICKHOUSE_USER=readonly
CLICKHOUSE_PASSWORD=secret
DATABASE_URL=file:./data/auth.db
AUTH_SECRET=your-secret
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
ENV_HOSTS_VISIBILITY=all
```

### Multi-Tenant SaaS (Cloud Mode)
```bash
DEPLOYMENT_MODE=cloud
DATABASE_URL=postgres://user:pass@localhost:5432/ch_monitor
AUTH_SECRET=your-secret
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
ENV_HOSTS_VISIBILITY=guest
```

### Docker Compose with Postgres
```bash
# Use docker-compose.postgres.yml instead of docker-compose.yml
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
AUTH_SECRET=your-generated-secret
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

## Database Comparison

| Database | Best For | Pros | Cons |
|----------|----------|------|------|
| **SQLite** | Getting started, single-server deployments | Zero config, single file, fast | Single-process writes, not ideal for horizontal scaling |
| **Postgres** | Production multi-server setups | Fully scalable, concurrent writes, managed options available | Separate service, more setup |
| **D1** | Cloudflare Workers deployments | Edge-native, managed by Cloudflare, automatic backups | Cloudflare-only, limited query size |

## Auto Migrations

Database migrations run automatically on startup by default. Disable with:
```bash
AUTO_MIGRATE=false
```

For D1 (Cloudflare Workers), migrations are applied at deploy time via wrangler.

## Deployment Guides

### Docker (with Docker Compose)

```bash
# Clone repository
git clone https://github.com/duyet/clickhouse-monitor.git
cd clickhouse-monitor

# Copy and configure environment
cp .env.example .env

# Edit .env with your settings
# - CLICKHOUSE_HOST
# - CLICKHOUSE_USER
# - CLICKHOUSE_PASSWORD
# - Optional: AUTH_SECRET, GITHUB_CLIENT_ID, etc.

# Start services
docker compose up -d

# View logs
docker compose logs -f app
```

**With Postgres:**
```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clickhouse-monitor
spec:
  replicas: 2
  selector:
    matchLabels:
      app: clickhouse-monitor
  template:
    metadata:
      labels:
        app: clickhouse-monitor
    spec:
      containers:
      - name: app
        image: ghcr.io/duyet/clickhouse-monitor:latest
        ports:
        - containerPort: 3000
        env:
        - name: CLICKHOUSE_HOST
          valueFrom:
            configMapKeyRef:
              name: ch-monitor-config
              key: clickhouse_host
        - name: CLICKHOUSE_USER
          valueFrom:
            configMapKeyRef:
              name: ch-monitor-config
              key: clickhouse_user
        - name: CLICKHOUSE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ch-monitor-secrets
              key: clickhouse_password
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ch-monitor-secrets
              key: database_url
        - name: AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: ch-monitor-secrets
              key: auth_secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: clickhouse-monitor
spec:
  type: LoadBalancer
  selector:
    app: clickhouse-monitor
  ports:
  - port: 80
    targetPort: 3000
```

### Cloudflare Workers

```bash
# Install dependencies
bun install

# Setup D1 database
wrangler d1 create clickhouse-monitor-auth

# Configure wrangler.toml with:
# - D1 database binding (AUTH_DB)
# - R2 bucket for cache (if needed)
# - Environment variables

# Set secrets
wrangler secret put CLICKHOUSE_HOST
wrangler secret put CLICKHOUSE_USER
wrangler secret put CLICKHOUSE_PASSWORD
wrangler secret put AUTH_SECRET

# Deploy
bun run cf:deploy
```

## Troubleshooting

### Connection Issues

**ClickHouse connection refused**
```bash
# Verify ClickHouse is running and accessible
curl http://your-clickhouse:8123/?query=SELECT%201

# Check CLICKHOUSE_HOST format
# Should be: http://host:8123 (with protocol and port)
```

**Authentication fails**
- Verify `AUTH_SECRET` is set and consistent
- Check DATABASE_URL is accessible
- Ensure OAuth credentials (CLIENT_ID, CLIENT_SECRET) are correct

### Database Issues

**SQLite locked**
- Restart container: `docker compose restart app`
- For production, migrate to Postgres

**Postgres connection refused**
- Verify DATABASE_URL format: `postgres://user:pass@host:5432/db`
- Check network connectivity between app and database

### Performance Issues

**Slow queries**
- Increase `CLICKHOUSE_MAX_EXECUTION_TIME` if queries timeout
- Check ClickHouse query performance: `SELECT * FROM system.query_log`
- Review slow query logs in app

**High memory usage**
- Reduce container memory limits if using SQLite
- Migrate to Postgres for better resource management
- Check for long-running queries in ClickHouse

## Security Best Practices

1. **Secrets Management**
   - Never commit `.env` with secrets
   - Use environment variables or secret management systems
   - Rotate `AUTH_SECRET` periodically if compromised

2. **Network Security**
   - Use HTTPS/TLS in production
   - Put behind reverse proxy (nginx, Cloudflare, etc.)
   - Restrict ClickHouse network access

3. **Database Security**
   - Use strong DATABASE_URL credentials
   - Enable SSL for Postgres connections
   - Regular backups, especially SQLite

4. **OAuth Security**
   - Use HTTPS callback URLs only
   - Verify provider certificates
   - Keep CLIENT_SECRET confidential

5. **ClickHouse Access**
   - Use dedicated read-only user for monitoring
   - Limit query timeout to prevent DoS
   - Monitor query logs for suspicious activity

## Monitoring & Logging

Enable debug logging:
```bash
DEBUG=true
```

View logs:
```bash
# Docker Compose
docker compose logs -f app

# Kubernetes
kubectl logs -f deployment/clickhouse-monitor

# Docker
docker logs -f container-id
```

Check application health:
```bash
curl http://localhost:3000/
```

## Upgrades

### Docker

```bash
# Pull latest image
docker pull ghcr.io/duyet/clickhouse-monitor:latest

# Recreate container
docker compose down
docker compose up -d

# Or use automatic updates with watchtower
docker run -d \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 \
  clickhouse-monitor
```

### Manual Installation

```bash
# Stop current version
npm stop

# Update source
git pull origin main

# Install dependencies
bun install

# Run migrations
AUTO_MIGRATE=true bun run start

# Start application
bun run start
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/duyet/clickhouse-monitor/issues
- Documentation: https://github.com/duyet/clickhouse-monitor
- ClickHouse Docs: https://clickhouse.com/docs
