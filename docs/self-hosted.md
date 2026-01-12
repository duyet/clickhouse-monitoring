# Self-Hosted Deployment Guide

This guide explains how to self-host the ClickHouse monitoring application with authentication and organization support.

## Prerequisites

- Node.js 18+ or Bun 10.18.2+
- Database (SQLite, PostgreSQL, or Cloudflare D1)
- ClickHouse cluster(s) to monitor
- Domain name (optional, but recommended)

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/duyet/clickhouse-monitoring.git
cd clickhouse-monitoring
bun install
```

### 2. Environment Configuration

Create `.env.local`:

```env
# Authentication
BETTER_AUTH_SECRET=your-super-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_URL=sqlite:./data/sqlite.db
# OR for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/clickhouse_monitor

# Encryption
CLICKHOUSE_ENCRYPTION_KEY=your-32-character-encryption-key

# ClickHouse (comma-separated for multiple hosts)
CLICKHOUSE_HOST=localhost,192.168.1.100
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-clickhouse-password
CLICKHOUSE_NAME=Production,Staging

# Optional
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Database Setup

```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:migrate
```

### 4. Build and Deploy

```bash
# Build application
bun run build

# Start production server
bun start
```

## Deployment Options

### Docker Deployment

#### 1. Create `Dockerfile`

```dockerfile
FROM node:18-alpine AS base
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/clickhouse_monitor
      - BETTER_AUTH_SECRET=your-secret
      - CLICKHOUSE_HOST=clickhouse
      - CLICKHOUSE_USER=default
      - CLICKHOUSE_PASSWORD=
    depends_on:
      - db
      - clickhouse
    volumes:
      - ./data:/app/data

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: clickhouse_monitor
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  clickhouse:
    image: clickhouse/clickhouse-server:23.8
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    environment:
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: ""

volumes:
  postgres_data:
  clickhouse_data:
```

#### 3. Deploy

```bash
docker-compose up -d
```

### Vercel Deployment

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Deploy

```bash
# Link project
vercel

# Deploy
vercel --prod
```

### Manual Server Deployment

#### 1. System Requirements

- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- Nginx (recommended)
- PostgreSQL (recommended)

#### 2. Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun (optional)
curl -fsSL https://bun.sh/install | bash

# Clone repository
git clone https://github.com/duyet/clickhouse-monitoring.git
cd clickhouse-monitoring

# Install dependencies
bun install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
bun run db:generate
bun run db:migrate

# Build application
bun run build

# Create service file
sudo tee /etc/systemd/system/clickhouse-monitor.service > /dev/null <<EOF
[Unit]
Description=ClickHouse Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/clickhouse-monitoring
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable clickhouse-monitor
sudo systemctl start clickhouse-monitor
```

#### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Configuration

### 1. HTTPS Setup

#### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Custom Certificate

Place your certificates in `/etc/ssl/certs/` and `/etc/ssl/private/`, then update Nginx config:

```nginx
listen 443 ssl http2;
ssl_certificate /etc/ssl/certs/your-domain.com.crt;
ssl_certificate_key /etc/ssl/private/your-domain.com.key;
```

### 2. Environment Security

#### Secure Secrets

1. **Never commit secrets to version control**
2. **Use environment variables** or secret management
3. **Rotate secrets regularly**

#### Database Security

1. **Use strong passwords**
2. **Enable SSL/TLS connections**
3. **Restrict database access**
4. **Regular backups**

#### Network Security

1. **Firewall configuration**
```bash
# UFW example
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

2. **Fail2Ban for authentication attempts**
```bash
sudo apt install fail2ban
```

### 3. ClickHouse Security

1. **Network restrictions**
2. **Authentication enabled**
3. **SSL/TLS encryption**
4. **Regular security updates**

## Monitoring and Logging

### Application Logs

```bash
# View logs
journalctl -u clickhouse-monitor -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Monitoring

- **PostgreSQL**: `pg_stat_activity` view
- **SQLite**: Use database studio
- **Custom metrics**: Application provides health endpoints

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/database
```

## Backup Strategy

### Database Backups

#### PostgreSQL

```bash
# Daily backup
pg_dump clickhouse_monitor > backup-$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump clickhouse_monitor | gzip > /backups/clickhouse-monitor-$DATE.sql.gz
find /backups -name "*.gz" -mtime +7 -delete
```

#### SQLite

```bash
# Simple copy
cp sqlite.db backup-$(date +%Y%m%d).db

# Compress backup
cp sqlite.db backup-$(date +%Y%m%d).db && gzip backup-$(date +%Y%m%d).db
```

### Application Backups

```bash
# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env.local docs/

# Backup user uploads (if any)
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## Scaling

### Horizontal Scaling

1. **Load balancer** (Nginx, HAProxy)
2. **Multiple application instances**
3. **Shared database**
4. **Distributed ClickHouse clusters**

### Database Scaling

1. **Read replicas** for PostgreSQL
2. **Connection pooling**
3. **Query optimization**

### Performance Optimization

1. **Caching**: Redis for session storage
2. **CDN**: Static asset delivery
3. **Compression**: Gzip/Brotli
4. **Minification**: CSS/JS optimization

## Troubleshooting

### Common Issues

1. **Build failures**: Check Node.js version and dependencies
2. **Database connection**: Verify DATABASE_URL and credentials
3. **Authentication**: Check OAuth provider configuration
4. **Memory issues**: Increase Node.js memory limit

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
bun run dev

# Debug specific modules
export DEBUG=drizzle:*
export DEBUG=better-auth:*
```

### Log Analysis

```bash
# Error patterns
grep -i error /var/log/nginx/error.log
grep -i error /var/log/syslog

# Performance metrics
grep -i "slow query" /var/log/app.log
```

## Maintenance

### Regular Tasks

1. **Update dependencies**
```bash
bun update
bun run audit
```

2. **Database maintenance**
```bash
# PostgreSQL
vacuum analyze;
reindex database clickhouse_monitor;

# SQLite
sqlite3 sqlite.db "VACUUM;"
```

3. **Security updates**
```bash
# System updates
sudo apt update && sudo apt upgrade

# Node.js security audit
npm audit fix
```

### Health Checks

Create a monitoring script:

```bash
#!/bin/bash
# health-check.sh

# Check application
APP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ $APP_HEALTH -ne 200 ]; then
    echo "Application health check failed"
    # Send alert or restart service
fi

# Check database
DB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/database)
if [ $DB_HEALTH -ne 200 ]; then
    echo "Database health check failed"
    # Send alert
fi
```

## Support

For issues and questions:

1. **GitHub Issues**: [Report bugs](https://github.com/duyet/clickhouse-monitoring/issues)
2. **Documentation**: [Full docs](https://github.com/duyet/clickhouse-monitoring/docs)
3. **Community**: [Discussions](https://github.com/duyet/clickhouse-monitoring/discussions)

## Contributing

We welcome contributions! Please see:

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Development Setup](DEVELOPMENT.md)