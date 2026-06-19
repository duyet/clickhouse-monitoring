/**
 * Trusted reverse-proxy auth provider.
 *
 * For deployments where chmonitor sits behind a proxy that performs the real
 * login (oauth2-proxy + Dex, Authelia, Traefik forward-auth, an nginx SSO
 * module, …) and forwards the authenticated user's identity as plain HTTP
 * headers. The worker TRUSTS those headers and builds a rich principal from
 * them: subject, name, email, avatar, roles/groups, plus arbitrary
 * deployment-defined custom claims.
 *
 * Difference vs the `proxy` provider: `proxy` is Cloudflare-Access-centric (it
 * verifies a signed `Cf-Access-Jwt-Assertion` JWT) and only extracts a bare
 * subject. `trusted` is forwarded-header-centric and extracts a full profile,
 * and can gate access on group/role membership (combining with the feature
 * permission matrix).
 *
 * SECURITY — header forgery. Forwarded headers are only trustworthy when the
 * worker is reachable EXCLUSIVELY through the proxy (the proxy overwrites the
 * identity headers on every request, stripping any a client tried to inject).
 * On a publicly-reachable worker any client could forge `X-Forwarded-User`. So
 * this provider authenticates only when ONE of the following holds:
 *
 *   (a) `CHM_TRUSTED_AUTH_SECRET` is set and the request carries a matching
 *       shared-secret header (constant-time compare) — the proxy proves itself
 *       with a secret the public cannot know; or
 *   (b) `CHM_TRUSTED_ALLOW_INSECURE=true` is set — an explicit operator
 *       acknowledgement that the worker is network-isolated behind the proxy
 *       (e.g. a Kubernetes ClusterIP service only reachable via the ingress).
 *
 * With neither, the provider FAILS CLOSED (denies every request) and warns, so
 * a misconfigured public deployment never silently trusts forged headers.
 */

import type { AuthPrincipal, AuthResult, ServerAuthProvider } from './types'

import { secretsMatch } from './constant-time'

const DEFAULTS = {
  userHeader: 'X-Forwarded-User',
  emailHeader: 'X-Forwarded-Email',
  nameHeader: 'X-Forwarded-Preferred-Username',
  avatarHeader: 'X-Forwarded-Avatar',
  groupsHeader: 'X-Forwarded-Groups',
  roleHeader: 'X-Forwarded-Role',
  secretHeader: 'X-Chm-Proxy-Secret',
} as const

function env(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined
  const value = process.env[key]
  return value === undefined || value === '' ? undefined : value
}

function header(request: Request, name: string): string | undefined {
  const value = request.headers.get(name)
  return value === null || value === '' ? undefined : value
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

/** Split a delimited list header (comma- or space-separated) into trimmed items. */
function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Parse `field:Header-Name` pairs from CHM_TRUSTED_CUSTOM_HEADERS into a map of
 * principal-claim key → header name. Invalid pairs (missing colon or empty
 * side) are skipped. e.g. `team:X-Forwarded-Team,dept:X-User-Dept`.
 */
function parseCustomHeaderMap(
  value: string | undefined
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const pair of parseList(value).flatMap((v) => v.split(','))) {
    const idx = pair.indexOf(':')
    if (idx <= 0) continue
    const field = pair.slice(0, idx).trim()
    const headerName = pair.slice(idx + 1).trim()
    if (field && headerName) map[field] = headerName
  }
  return map
}

/**
 * Decide whether the proxy has proven itself for THIS request.
 *
 * Returns:
 *  - `true`  → trust the forwarded headers (secret matched, or insecure opt-in)
 *  - `false` → do not trust (no secret/opt-in, or secret mismatch/absent)
 */
function proxyIsTrusted(request: Request): boolean {
  const sharedSecret = env('CHM_TRUSTED_AUTH_SECRET')

  if (sharedSecret) {
    const secretHeaderName =
      env('CHM_TRUSTED_SHARED_SECRET_HEADER') ?? DEFAULTS.secretHeader
    const provided = header(request, secretHeaderName)
    if (!provided) return false
    return secretsMatch(provided, sharedSecret)
  }

  if (parseBoolean(env('CHM_TRUSTED_ALLOW_INSECURE'))) return true

  // No secret and no explicit insecure opt-in: refuse to trust headers.
  console.warn(
    '[auth:trusted] CHM_AUTH_PROVIDER=trusted but neither CHM_TRUSTED_AUTH_SECRET ' +
      'nor CHM_TRUSTED_ALLOW_INSECURE is set. Forwarded identity headers are NOT ' +
      'trusted (failing closed). Set a shared secret, or set ' +
      'CHM_TRUSTED_ALLOW_INSECURE=true only when the worker is network-isolated behind the proxy.'
  )
  return false
}

/** Build a principal from forwarded identity headers, or null when no subject. */
function readPrincipal(request: Request): AuthPrincipal | null {
  const userHeader = env('CHM_TRUSTED_USER_HEADER') ?? DEFAULTS.userHeader
  const emailHeader = env('CHM_TRUSTED_EMAIL_HEADER') ?? DEFAULTS.emailHeader

  const user = header(request, userHeader)
  const email = header(request, emailHeader)

  // Subject identifies the principal: prefer the user header, fall back to
  // email. Without either there is no usable identity → not authenticated.
  const subject = user ?? email
  if (!subject) return null

  const nameHeader = env('CHM_TRUSTED_NAME_HEADER') ?? DEFAULTS.nameHeader
  const avatarHeader = env('CHM_TRUSTED_AVATAR_HEADER') ?? DEFAULTS.avatarHeader
  const groupsHeader = env('CHM_TRUSTED_GROUPS_HEADER') ?? DEFAULTS.groupsHeader
  const roleHeader = env('CHM_TRUSTED_ROLE_HEADER') ?? DEFAULTS.roleHeader

  // Roles come from the groups header plus an optional single-role header,
  // de-duplicated while preserving order.
  const roles = Array.from(
    new Set([
      ...parseList(header(request, groupsHeader)),
      ...parseList(header(request, roleHeader)),
    ])
  )

  const custom: Record<string, string> = {}
  for (const [field, headerName] of Object.entries(
    parseCustomHeaderMap(env('CHM_TRUSTED_CUSTOM_HEADERS'))
  )) {
    const value = header(request, headerName)
    if (value !== undefined) custom[field] = value
  }

  const principal: AuthPrincipal = { subject }
  const name = header(request, nameHeader)
  if (name) principal.name = name
  if (email) principal.email = email
  const avatarUrl = header(request, avatarHeader)
  if (avatarUrl) principal.avatarUrl = avatarUrl
  if (roles.length > 0) principal.roles = roles
  if (Object.keys(custom).length > 0) principal.custom = custom

  return principal
}

/**
 * Gate access on group/role membership. When `CHM_TRUSTED_ALLOWED_GROUPS` is
 * set (comma list), the principal must carry at least one matching role/group
 * (case-insensitive) — otherwise access is denied even though the proxy
 * authenticated them. Unset → no group restriction (any authenticated user).
 */
function passesGroupGate(principal: AuthPrincipal): boolean {
  const allowed = parseList(env('CHM_TRUSTED_ALLOWED_GROUPS')).map((g) =>
    g.toLowerCase()
  )
  if (allowed.length === 0) return true

  const have = new Set((principal.roles ?? []).map((r) => r.toLowerCase()))
  return allowed.some((g) => have.has(g))
}

export class TrustedAuthProvider implements ServerAuthProvider {
  async authenticateRequest(request: Request): Promise<AuthResult> {
    if (!proxyIsTrusted(request)) return { authenticated: false }

    const principal = readPrincipal(request)
    if (!principal) return { authenticated: false }

    if (!passesGroupGate(principal)) return { authenticated: false }

    return { authenticated: true, subject: principal.subject, principal }
  }
}
