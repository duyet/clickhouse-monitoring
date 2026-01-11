# Authentication Foundation Module - Phase 1

## Overview

The authentication foundation module provides the core infrastructure for SSO implementation in ClickHouse Monitor, supporting both self-hosted and cloud deployment modes.

**Module Location:** `/lib/auth/`

**Status:** Phase 1 - Foundation Complete ✅

## Architecture

### Deployment Modes

The system supports two deployment modes:

- **self-hosted**: Default mode. Auth is optional, no multi-tenant support. Useful for private deployments.
- **cloud**: Auth required, multi-tenant support. For hosted deployments.

### Components

#### 1. Configuration Module (`config.ts`)

Handles deployment mode detection and environment parsing.

**Key Functions:**

- `getDeploymentMode()` - Detects deployment mode from `DEPLOYMENT_MODE` env var (defaults to 'self-hosted')
- `detectDatabaseAdapter()` - Auto-detects database from `DATABASE_URL` scheme:
  - `postgres://`, `postgresql://` → postgres
  - `d1://` → Cloudflare D1
  - `file:`, `sqlite:` → SQLite
  - `libsql://` → LibSQL (Turso)
  - None set → none

- `isAuthEnabled()` - Checks if auth is fully configured:
  - Requires: DATABASE_URL set AND (AUTH_SECRET OR OAuth configured)
  - Returns false if either condition missing

- `getAuthConfig()` - Returns complete auth configuration object
- `isCloudMode()` / `isSelfHosted()` - Helper predicates

**Environment Variables:**

```bash
DEPLOYMENT_MODE=self-hosted|cloud         # Default: self-hosted
DATABASE_URL=<database-connection-string> # Required for auth
AUTH_SECRET=<secret-string>               # OR OAuth required
AUTH_GITHUB_ID=<id>                       # Optional OAuth
AUTH_GITHUB_SECRET=<secret>               # Optional OAuth
AUTH_GOOGLE_ID=<id>                       # Optional OAuth
AUTH_GOOGLE_SECRET=<secret>               # Optional OAuth
```

#### 2. Permissions Module (`permissions.ts`)

Implements Role-Based Access Control (RBAC).

**Roles (Hierarchy):**

1. **owner** (level 4) - Full organization control, billing, member management
2. **admin** (level 3) - Administrative operations, member management
3. **member** (level 2) - Standard user, can execute queries
4. **viewer** (level 1) - Read-only access to dashboards
5. **guest** (level 0) - Unauthenticated, limited read-only access

**Permissions:**

```typescript
view:dashboard       // All roles
view:tables          // All roles
view:queries         // All roles
view:clusters        // All roles
execute:query        // owner, admin, member, guest
kill:query           // owner, admin, member
manage:hosts         // owner, admin
invite:members       // owner, admin
change:roles         // owner only
manage:settings      // owner, admin
manage:billing       // owner only
delete:org           // owner only
```

**Key Functions:**

- `hasPermission(role, permission)` - Check if role can perform action
- `getPermissionsForRole(role)` - Get all permissions for a role
- `getRoleHierarchy(role)` - Get numeric hierarchy level
- `isRoleHigherThan(role1, role2)` - Compare role levels
- `getAssignableRoles()` - Get roles that can be assigned (admin, member, viewer)
- `getRoleDescription(role)` - Get human-readable role description

#### 3. Hosts Module (`hosts.ts`)

Manages multi-host support with access control.

**Host Sources:**

- **Environment-based**: Configured via `CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_NAME`
- **Database-based**: Will be implemented in Phase 2

**Visibility Modes:**

Controlled by `ENV_HOSTS_VISIBILITY` environment variable:

- `all` (default) - Show env hosts to all users (authenticated and guests)
- `guest` - Show env hosts only to unauthenticated users
- `none` - Never show env hosts

**Key Functions:**

- `getEnvHosts()` - Parse environment host configuration
- `getHosts(ctx)` - Get accessible hosts based on auth context
- `getHost(ctx, hostId)` - Get single host by ID
- `isHostAccessible(ctx, hostId)` - Check host access
- `getPrimaryHost(ctx)` - Get default host for user

**Access Control Logic:**

```
If database not configured:
  → Return all env hosts (auth not enabled)

If database configured:
  - Check ENV_HOSTS_VISIBILITY setting
  - For guests (no session): Show based on 'guest' mode
  - For authenticated users: Show unless visibility='none'
```

### Module Exports (`index.ts`)

All utilities are centrally exported:

```typescript
import {
  // Config
  getDeploymentMode,
  isAuthEnabled,
  detectDatabaseAdapter,
  getAuthConfig,
  isCloudMode,
  isSelfHosted,
  type DeploymentMode,
  type DatabaseAdapter,
  type AuthConfig,

  // Permissions
  hasPermission,
  getPermissionsForRole,
  getRoleHierarchy,
  isRoleHigherThan,
  isRoleEqualOrHigherThan,
  getAssignableRoles,
  getAllRoles,
  getRoleDescription,
  type Role,
  type Permission,
  permissions,

  // Hosts
  getHosts,
  getHost,
  isHostAccessible,
  getPrimaryHost,
  getEnvHosts,
  type Host,
  type Session,
  type AuthContext,
} from '@/lib/auth'
```

## Testing

Comprehensive test coverage with 74 tests across 3 test files:

**Config Tests** (24 tests)
- Deployment mode detection
- Database adapter detection
- Auth enablement logic
- Configuration object generation

**Permissions Tests** (26 tests)
- Permission checking
- Role hierarchy
- Permission enumeration
- Assignable roles

**Hosts Tests** (24 tests)
- Environment host parsing
- Host access control
- Visibility mode enforcement
- Host retrieval functions

**Run Tests:**
```bash
bun test lib/auth
```

**Coverage:** 74 tests, 201 assertions, 100% pass rate

## Usage Examples

### Check if Auth is Enabled

```typescript
import { isAuthEnabled, getAuthConfig } from '@/lib/auth'

if (isAuthEnabled()) {
  const config = getAuthConfig()
  console.log('Auth enabled with', config.databaseAdapter)
}
```

### Check User Permissions

```typescript
import { hasPermission, type Role } from '@/lib/auth'

const userRole: Role = 'member'

if (hasPermission(userRole, 'execute:query')) {
  // User can execute queries
}

if (!hasPermission(userRole, 'delete:org')) {
  // User cannot delete organization
}
```

### Get Available Hosts

```typescript
import { getHosts, type AuthContext } from '@/lib/auth'

const ctx: AuthContext = {
  session: null, // Guest user
}

const hosts = getHosts(ctx)
console.log('Available hosts:', hosts.map(h => h.name))
```

### Check Role Hierarchy

```typescript
import { isRoleHigherThan } from '@/lib/auth'

const canManage = isRoleHigherThan('admin', 'member')
// true - admin > member
```

## Integration Points

### Phase 2 - Database Integration

The following will be added in Phase 2:

1. **Database Schema** - User, Organization, Role assignments
2. **Database Adapter** - Query/mutation layer for auth data
3. **Session Management** - JWT/session token handling
4. **OAuth Integration** - GitHub, Google OAuth flows
5. **Multi-tenant** - Organization isolation for cloud mode

### Phase 3 - API Integration

1. **Auth Middleware** - Request authentication/authorization
2. **API Endpoints** - User/org/member management
3. **Protected Routes** - Dashboard, settings, admin panels

## Environment Configuration Examples

### Self-Hosted (No Auth)

```bash
# .env.local
CLICKHOUSE_HOST=localhost
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=password
# No auth configured - guests see all env hosts
```

### Self-Hosted (With Auth)

```bash
# .env.local
DEPLOYMENT_MODE=self-hosted
CLICKHOUSE_HOST=prod,staging
CLICKHOUSE_USER=monitor,monitor
DATABASE_URL=sqlite:./auth.db
AUTH_SECRET=your-secret-key
ENV_HOSTS_VISIBILITY=all
```

### Cloud Mode (OAuth)

```bash
# .env.local
DEPLOYMENT_MODE=cloud
CLICKHOUSE_HOST=internal-host
CLICKHOUSE_USER=cloud-user
DATABASE_URL=postgres://user:pass@db.example.com/clickhouse_auth
AUTH_SECRET=cloud-secret
AUTH_GITHUB_ID=github-app-id
AUTH_GITHUB_SECRET=github-app-secret
ENV_HOSTS_VISIBILITY=none
```

## Type Safety

All types are exported and use TypeScript strict mode:

```typescript
// Permission type is a union of all available permissions
type Permission = 'view:dashboard' | 'execute:query' | ...

// Role type is a union of all roles
type Role = 'owner' | 'admin' | 'member' | 'viewer' | 'guest'

// Deployment mode type
type DeploymentMode = 'self-hosted' | 'cloud'

// Database adapter type
type DatabaseAdapter = 'd1' | 'postgres' | 'libsql' | 'sqlite' | 'none'

// Auth context type
interface AuthContext {
  session: Session | null
  organizationId?: string
}

interface Session {
  userId: string
  email: string
  role: Role
}

interface Host {
  id: string
  name: string
  host: string
  username: string
  source: 'env' | 'database'
}
```

## Best Practices

1. **Always check auth enabled** before assuming database is available
2. **Use the public API** from `@/lib/auth/index.ts`, not individual modules
3. **Handle null sessions** for guest access scenarios
4. **Respect visibility settings** when listing hosts
5. **Use role hierarchy** for permission checks when appropriate
6. **Type all auth contexts** with AuthContext interface

## File Structure

```
lib/auth/
├── config.ts              # Deployment mode & auth detection
├── permissions.ts         # RBAC implementation
├── hosts.ts              # Multi-host support & access control
├── index.ts              # Public API exports
└── __tests__/
    ├── config.test.ts    # 24 tests
    ├── permissions.test.ts # 26 tests
    └── hosts.test.ts     # 24 tests
```

## Performance Characteristics

- **Zero database queries** in Phase 1 (all env-based)
- **Minimal memory overhead** - small lookup tables for permissions
- **Fast permission checks** - O(1) for most operations
- **Synchronous** - all functions return immediately

## Security Considerations

1. **Environment variables** contain secrets - never log them
2. **Role assignments** will be validated server-side in Phase 2
3. **Session tokens** will use secure, httponly cookies in Phase 2
4. **OAuth flows** will follow best practices (PKCE, state parameters)
5. **Database passwords** from env vars never exposed to client

## Future Enhancements

Phase 2+:

- [ ] Database-backed roles and permissions
- [ ] Session management and token refresh
- [ ] OAuth provider integration
- [ ] Multi-tenant organization isolation
- [ ] Audit logging for auth events
- [ ] SAML/LDAP support for enterprise
- [ ] Rate limiting for auth endpoints
- [ ] Two-factor authentication
