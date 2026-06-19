/**
 * Pluggable server-side auth provider contract.
 *
 * A `ServerAuthProvider` answers one question for an incoming `/api/v1`
 * request: is the caller an authenticated principal? Each configured auth
 * provider (`none` / `clerk` / `proxy` / `trusted`) supplies one
 * implementation; the guard in `api-guard.ts` resolves the active one via
 * `resolveServerAuthProvider`.
 *
 * Every implementation MUST fail closed — any internal error or missing config
 * resolves to `{ authenticated: false }` rather than throwing, so a misconfig
 * never accidentally grants access.
 */

/**
 * Rich identity for an authenticated principal.
 *
 * Populated by providers that can extract a profile (notably `trusted`, which
 * reads forwarded headers from a reverse proxy). `subject` is the only required
 * field; everything else is best-effort and surfaced to the UI (avatar, name)
 * and to the permission layer (`roles`). `custom` carries deployment-defined
 * extra claims mapped from arbitrary headers.
 */
export interface AuthPrincipal {
  /** Stable identifier for the principal (user id, email, …). */
  subject: string
  /** Human-readable display name, when the proxy forwards one. */
  name?: string
  /** Email address, when forwarded. */
  email?: string
  /** Avatar/picture URL, when forwarded. */
  avatarUrl?: string
  /** Roles or groups the principal belongs to (e.g. Dex/OIDC groups). */
  roles?: string[]
  /** Arbitrary deployment-defined claims mapped from custom headers. */
  custom?: Record<string, string>
}

export interface AuthResult {
  authenticated: boolean
  /** Stable identifier for the principal (user id, email, …) when known. */
  subject?: string
  /** Rich profile for the principal, when the provider can supply one. */
  principal?: AuthPrincipal
}

export interface ServerAuthProvider {
  authenticateRequest(request: Request): Promise<AuthResult>
}
