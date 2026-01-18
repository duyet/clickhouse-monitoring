# Authentication Module - Phase 1

Quick reference for the authentication foundation.

## Modules

### config.ts - Deployment & Configuration
Detects deployment mode and manages auth configuration.

```typescript
import {
  getDeploymentMode,          // 'self-hosted' | 'cloud'
  isAuthEnabled,              // boolean
  detectDatabaseAdapter,      // 'd1' | 'postgres' | 'libsql' | 'sqlite' | 'none'
  getAuthConfig,              // Complete config object
  isCloudMode,               // boolean
  isSelfHosted,              // boolean
} from '@/lib/auth'
```

### permissions.ts - RBAC System
Role-based access control with granular permissions.

```typescript
import {
  hasPermission,                   // (role, permission) => boolean
  getPermissionsForRole,          // (role) => Permission[]
  getRoleHierarchy,               // (role) => number
  isRoleHigherThan,               // (r1, r2) => boolean
  isRoleEqualOrHigherThan,        // (r1, r2) => boolean
  getAssignableRoles,             // () => Role[]
  getAllRoles,                    // () => Role[]
  getRoleDescription,             // (role) => string
  type Role,                      // 'owner' | 'admin' | 'member' | 'viewer' | 'guest'
  type Permission,                // Union of all permission strings
  permissions,                    // Permission matrix
} from '@/lib/auth'
```

### hosts.ts - Multi-Host Management
Manages ClickHouse host access control.

```typescript
import {
  getHosts,                  // (ctx) => Host[]
  getHost,                   // (ctx, hostId) => Host | null
  isHostAccessible,          // (ctx, hostId) => boolean
  getPrimaryHost,            // (ctx) => Host | null
  getEnvHosts,              // () => Host[]
  type Host,                // { id, name, host, username, source }
  type AuthContext,         // { session, organizationId? }
  type Session,             // { userId, email, role }
} from '@/lib/auth'
```

## Common Patterns

### Check if user can do something
```typescript
const role: Role = 'member'
if (hasPermission(role, 'execute:query')) {
  // Allow query execution
}
```

### Get all permissions for a role
```typescript
const adminPerms = getPermissionsForRole('admin')
// Returns array of permission strings admin has
```

### Get available hosts for user
```typescript
const ctx: AuthContext = {
  session: user, // or null for guest
}
const hosts = getHosts(ctx)
```

### Compare role authority
```typescript
const canManageUser = isRoleHigherThan(userRole, targetRole)
```

## Role Hierarchy

```
owner (4)     - Full control
  ↓
admin (3)     - Management
  ↓
member (2)    - Standard
  ↓
viewer (1)    - Read-only
  ↓
guest (0)     - Unauthenticated
```

## Permissions Matrix

| Permission | Owner | Admin | Member | Viewer | Guest |
|-----------|-------|-------|--------|--------|-------|
| view:dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| view:tables | ✅ | ✅ | ✅ | ✅ | ✅ |
| execute:query | ✅ | ✅ | ✅ | ❌ | ✅ |
| kill:query | ✅ | ✅ | ✅ | ❌ | ❌ |
| manage:hosts | ✅ | ✅ | ❌ | ❌ | ❌ |
| invite:members | ✅ | ✅ | ❌ | ❌ | ❌ |
| change:roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| manage:settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage:billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| delete:org | ✅ | ❌ | ❌ | ❌ | ❌ |

## Environment Variables

**Deployment:**
- `DEPLOYMENT_MODE` - 'self-hosted' (default) or 'cloud'

**Database:**
- `DATABASE_URL` - Connection string (postgres, sqlite, d1, libsql)

**Auth Secrets:**
- `AUTH_SECRET` - Session/token secret
- `AUTH_GITHUB_ID` - GitHub OAuth ID
- `AUTH_GITHUB_SECRET` - GitHub OAuth secret
- `AUTH_GOOGLE_ID` - Google OAuth ID
- `AUTH_GOOGLE_SECRET` - Google OAuth secret

**ClickHouse:**
- `CLICKHOUSE_HOST` - Comma-separated hosts
- `CLICKHOUSE_USER` - Comma-separated usernames
- `CLICKHOUSE_PASSWORD` - Comma-separated passwords
- `CLICKHOUSE_NAME` - Comma-separated display names

**Visibility:**
- `ENV_HOSTS_VISIBILITY` - 'all' (default), 'guest', or 'none'

## Tests

Run all tests:
```bash
bun test lib/auth
```

Run specific test file:
```bash
bun test lib/auth/__tests__/config.test.ts
```

Coverage: 74 tests, 201 assertions, 100% pass rate

## Files

```
lib/auth/
├── config.ts              # 172 lines - Deployment detection
├── permissions.ts         # 150 lines - RBAC system
├── hosts.ts              # 228 lines - Multi-host management
├── index.ts              # 44 lines - Public API
└── __tests__/
    ├── config.test.ts    # 230 lines - 24 tests
    ├── permissions.test.ts # 212 lines - 26 tests
    └── hosts.test.ts     # 249 lines - 24 tests

docs/
└── AUTH_FOUNDATION.md     # 395 lines - Detailed guide
```

## Type Safety

All exports are fully typed with TypeScript strict mode. No type errors.

```typescript
// All these are properly typed
const mode: DeploymentMode = getDeploymentMode()
const adapter: DatabaseAdapter = detectDatabaseAdapter()
const enabled: boolean = isAuthEnabled()
const role: Role = 'member'
const perm: Permission = 'execute:query'
const hosts: Host[] = getHosts(ctx)
```

## Next Steps - Phase 2

- [ ] Database schema for users/orgs/roles
- [ ] Database adapter implementation
- [ ] Session/token management
- [ ] OAuth provider integration
- [ ] Multi-tenant isolation
- [ ] API middleware for auth
- [ ] Protected routes and endpoints
